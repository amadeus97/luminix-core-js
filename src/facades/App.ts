import axios from 'axios';

import Config from './Config';
import Macro from './Macro';

import runCoreMacros from '../macros';
import Repository from './Repository';
import Auth from './Auth';

import { AppFacades, AppFacade, BootOptions } from '../types/App';
import Log from './Log';
import Plugin from '../contracts/Plugin';

export default class App implements AppFacade {

    private facades: AppFacades = {} as AppFacades;
    private booted = false;
    private _plugins: Plugin[] = [];

    make(key?: string) {
        if (!key) {
            return this.facades;
        }
        if (this.facades[key]) {
            return this.facades[key];
        }
        return undefined;
    }

    has(key: string) {
        return !!this.facades[key];
    }

    add(key: string, facade: any) {
        if (this.facades[key]) {
            const { config } = this.facades;
            if (config && config.get('app.debug', false)) {
                console.warn(`[Luminix] Facade ${key} already registered. Registration will be ignored.`);
            }
            return;
        }
        this.facades[key] = facade;
    }

    plugins() {
        return this._plugins;
    }

    async boot(options: BootOptions = {}) {

        if (this.booted) {
            throw new Error('[Luminix] App already booted');
        }
        this.booted = true;

        // Boot macros
        this.add('macro', new Macro());
        const { macro } = this.facades;

        macro.doAction('init', this);

        const { 
            config: configObject = {}, 
            plugins = [], 
            macros,
            skipBootRequest = false
        } = options;

        if (configObject?.app?.debug) {
            console.log('[Luminix] Booting app with options:', options);
        }

        this._plugins = plugins;

        const registrablePlugins = plugins.filter(p => typeof p.register === 'function');
        for (const plugin of registrablePlugins) {
            if (configObject?.app?.debug) {
                console.log(`[Luminix] Registering plugin: "${plugin.name}"`);
            }
            (plugin.register as Function)(this);
            if (configObject?.app?.debug) {
                console.log(`[Luminix] Plugin "${plugin.name}" registered`);
            }
        }

        macro.doAction('registered', this);

        // Boot Config
        this.add('config', new Config(configObject));

        // Boot Log
        this.add('log', new Log(this));

        const { config, log: logger } = this.facades;

        if (!skipBootRequest) {
            const { data } = await axios.get(
                config.get('app.bootUrl', '/api/luminix/init')
            );

            logger.log('[Luminix] Backend responded with:', data);

            if (data && typeof data === 'object') {
                config.merge('boot', data);
            }
        }

        config.lock('boot');

        this.add('auth', new Auth(this));
        this.add('repository', new Repository(this));

        logger.log('[Luminix] All facades registered:', this.facades);

        runCoreMacros(this.facades);

        const { auth } = this.facades;

        const bootablePlugins = plugins.filter(p => typeof p.boot === 'function');
        // Boot plugins
        for (const plugin of bootablePlugins) {

            logger.log(`[Luminix] Booting plugin: "${plugin.name}"`);

            (plugin.boot as Function)(this.facades);

            logger.log(`[Luminix] Plugin "${plugin.name}" booted`);
            
        }

        // Boot custom macros
        if (typeof macros === 'function') {
            macros(this.facades);

            logger.log('[Luminix] User-defined macros booted');
            
        }


        logger.log('[Luminix] App boot completed');
        logger.log(' + config:', config.all());
        logger.log(` + ${plugins.length} plugins registered`);
        logger.log(` + ${Object.keys(config.get('boot.models', {})).length} models loaded`);
        logger.log(` + ${Object.keys(config.get('boot.routes', {})).length} routes available`);
        logger.log(` + ${macro.getActions().length} actions registered`);
        logger.log(` + ${macro.getFilters().length} filters registered`);

        if (config.get('app.debug', false)) {
            if (!auth.check()) {
                logger.log('[Luminix] User is not authenticated');
            } else {
                logger.log('[Luminix] User is authenticated');
                logger.log(' + User:', auth.user());
            }
        }

        macro.doAction('booted', this.facades);

        return this.facades;
    }
}
