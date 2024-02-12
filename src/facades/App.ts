import axios from 'axios';

import Config from './Config';
import Macro from './Macro';

import Repository from './Repository';
import Auth from './Auth';

import { AppFacades, AppFacade, BootOptions } from '../types/App';
import Log from './Log';
import Plugin from '../contracts/Plugin';
import Route from './Route';

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

        this.add('macro', new Macro());
        const { macro } = this.facades;

        macro.doAction('init', this);

        // Boot Log
        this.add('log', new Log(this));

        // Boot Config
        this.add('config', new Config(configObject, this.facades.log));
        
        // Boot Route
        this.add('route', new Route(this));

        const { config, log: logger } = this.facades;

        if (!skipBootRequest) {
            const { data } = await axios.get(
                config.get('app.bootUrl', '/api/luminix/init')
            );

            logger.info('[Luminix] Backend responded with:', data);

            if (data && typeof data === 'object') {
                config.merge('boot', data);
            }
        }

        config.lock('boot');

        this.add('auth', new Auth(this));
        this.add('repository', new Repository(this));

        logger.info('[Luminix] All facades registered:', this.facades);

        const { auth } = this.facades;

        const bootablePlugins = plugins.filter(p => typeof p.boot === 'function');
        // Boot plugins
        for (const plugin of bootablePlugins) {

            logger.info(`[Luminix] Booting plugin: "${plugin.name}"`);

            (plugin.boot as Function)(this.facades);

            logger.info(`[Luminix] Plugin "${plugin.name}" booted`);
            
        }

        // Boot custom macros
        if (typeof macros === 'function') {
            macros(this.facades);

            logger.info('[Luminix] User-defined macros booted');
            
        }


        logger.info('[Luminix] App boot completed');
        logger.info(' + config:', config.all());
        logger.info(` + ${plugins.length} plugins registered`);
        logger.info(` + ${Object.keys(config.get('boot.models', {})).length} models loaded`);
        logger.info(` + ${Object.keys(config.get('boot.routes', {})).length} routes available`);
        logger.info(` + ${macro.getActions().length} actions registered`);
        logger.info(` + ${macro.getFilters().length} filters registered`);

        if (config.get('app.debug', false)) {
            if (!auth.check()) {
                logger.info('[Luminix] User is not authenticated');
            } else {
                logger.info('[Luminix] User is authenticated');
                logger.info(' + User:', auth.user());
            }
        }

        macro.doAction('booted', this.facades);

        return this.facades;
    }
}
