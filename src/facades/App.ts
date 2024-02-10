import axios from "axios";

import Config from "./Config";
import Macro from "./Macro";

import runCoreMacros from '../macros';
import Repository from "./Repository";
import Auth from "./Auth";

import { AppContainers, AppFacade, BootOptions } from "../types/App";
import Log from "./Log";

export default class App implements AppFacade {
    private containers: AppContainers = {} as AppContainers;
    private booted = false;

    getContainers() {
        return this.containers;
    }

    getContainer<T extends keyof AppContainers>(key: T): AppContainers[T] {
        if (this.containers[key]) {
            return this.containers[key];
        }
        return undefined;
    }

    hasContainer(key: string) {
        return !!this.containers[key];
    }

    registerContainer(key: string, container: any) {
        if (this.containers[key]) {
            const config = this.getContainer('config');
            if (config && config.get('app.debug', false)) {
                console.warn(`[Luminix] Container ${key} already registered. Registration will be ignored.`);
            }
            return;
        }
        this.containers[key] = container;
    }

    restart() {
        this.booted = false;
        this.containers = {} as AppContainers;
    }

    async boot(options: BootOptions = {}): Promise<AppContainers> {

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
        this.registerContainer('log', logger);

        // Boot macros
        this.registerContainer('macro', new Macro());

        // let config = this.getContainer('config') as Config;
        const config = new Config(configObject);

        this.registerContainer('config', config);

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

        this.registerContainer('auth', new Auth(this));
        this.registerContainer('repository', new Repository(this));

        logger.log('[Luminix] All containers registered:', this.containers);

        runCoreMacros(this.containers);

        const bootablePlugins = plugins.filter(p => typeof p.boot === 'function');
        // Boot plugins
        for (const plugin of bootablePlugins) {

            logger.log(`[Luminix] Booting plugin: "${plugin.name}"`);

            (plugin.boot as Function)(this.containers);

            logger.log(`[Luminix] Plugin "${plugin.name}" booted`);
            
        }

        // Boot custom macros
        if (typeof macros === 'function') {
            macros(this.containers);

            logger.log('[Luminix] User-defined macros booted');
            
        }


        logger.log('[Luminix] App boot completed');
        logger.log(' + App Configuration:', config.all());
        logger.log(` + Number of plugins: ${plugins.length}`);
        logger.log(' + Models loaded:', Object.keys(config.get('boot.models', {})).join(', '));
        logger.log(' + Routes available:', Object.keys(config.get('boot.routes', {})).join(', '));

        if (!this.getContainer('auth').check()) {
            logger.log('[Luminix] User is not authenticated');
        } else {
            logger.log('[Luminix] User is authenticated');
            logger.log(' + User:', this.getContainer('auth').user());
        }

        return this.containers;
    }
}
