import axios from "axios";

import Config from "./Config";
import Macro from "./Macro";

import runCoreMacros from '../macros';
import Repository from "./Repository";
import Auth from "./Auth";

import { AppFacades, AppFacade, BootOptions } from "../types/App";
import Log from "./Log";

export default class App implements AppFacade {

    private facades: AppFacades = {} as AppFacades;
    private booted = false;

    make<T extends keyof AppFacades>(key?: T): AppFacades[T] {
        if (!key) {
            return this.facades as AppFacades[T];
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
            const config = this.make('config');
            if (config && config.get('app.debug', false)) {
                console.warn(`[Luminix] Facade ${key} already registered. Registration will be ignored.`);
            }
            return;
        }
        this.facades[key] = facade;
    }

    restart() {
        this.booted = false;
        this.facades = {} as AppFacades;
    }

    async boot(options: BootOptions = {}): Promise<AppFacades> {

        if (this.booted) {
            throw new Error('[Luminix] App already booted');
        }
        this.booted = true;

        const { 
            config: configObject = {}, 
            plugins = [], 
            macros = () => null,
            skipBootRequest = false
        } = options;

        if (configObject?.app?.debug) {
            console.log('[Luminix] Booting app with options:', options);
        }

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

        // Boot Log
        const logger = new Log(this)
        this.add('log', logger);

        // Boot macros
        this.add('macro', new Macro());

        const config = new Config(configObject);

        this.add('config', config);

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
        logger.log(' + App Configuration:', config.all());
        logger.log(` + Number of plugins: ${plugins.length}`);
        logger.log(' + Models loaded:', Object.keys(config.get('boot.models', {})).join(', '));
        logger.log(' + Routes available:', Object.keys(config.get('boot.routes', {})).join(', '));

        if (!this.make('auth').check()) {
            logger.log('[Luminix] User is not authenticated');
        } else {
            logger.log('[Luminix] User is authenticated');
            logger.log(' + User:', this.make('auth').user());
        }

        return this.facades;
    }
}
