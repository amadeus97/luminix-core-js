import { AppFacades, AppFacade } from '../types/App';

import Auth from './Auth';
import Log from './Log';
import Macro from './Macro';
import Repository from './Repository';
import Route from './Route';

import Plugin from '../contracts/Plugin';
import PropertyBag from '../contracts/PropertyBag';
import axios from 'axios';

export default class App implements AppFacade {

    private facades: AppFacades = {} as AppFacades;
    private booted = false;
    private _plugins: Plugin[] = [];

    readonly make: AppFacade['make'] = (key = undefined) => {
        if (!key) {
            return this.facades;
        }
        if (key in this.facades) {
            return this.facades[key];
        }
        return undefined;
    }

    readonly has: AppFacade['has'] = (key) => {
        return !!this.facades[key];
    }

    readonly bind: AppFacade['bind'] = (key, facade) => {
        if (this.facades[key]) {
            return;
        }
        this.facades[key] = facade;
    }

    readonly plugins = () => {
        return this._plugins;
    }

    readonly boot: AppFacade['boot'] = async (options = {}) => {

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

        this.bind('macro', new Macro());
        const { macro } = this.facades;

        macro.doAction('init', this);

        // Boot Log
        this.bind('log', new Log(this));

        // Boot Config
        this.bind('config', new PropertyBag(configObject));
        
        // Boot Route
        this.bind('route', new Route(this));

        const { config, log: logger } = this.facades;

        if (!skipBootRequest) {
            const { data } = await axios.get(config.get('app.bootUrl', '/api/luminix/init'));

            logger.info('[Luminix] Backend responded with:', data);

            if (data && typeof data === 'object') {
                config.merge('boot', data);
            }
        }

        config.lock('boot');

        this.bind('auth', new Auth(this));
        this.bind('repository', new Repository(this));

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
