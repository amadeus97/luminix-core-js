// import axios from "axios";

import Config from "./Config";
import Macro from "./Macro";

import runCoreMacros from '../macros';
import Repository from "./Repository";
import Auth from "./Auth";

import { AppContainers, AppInternal, BootOptions } from "../types/App";

export default class App implements AppInternal {
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
            macros = () => null 
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

        // Boot macros
        this.registerContainer('macro', new Macro());

        // let config = this.getContainer('config') as Config;
        const config = new Config(configObject);

        this.registerContainer('config', config);

        // const { data } = await axios.get(
        //     config.get('app.bootUrl', '/api/luminix/init')
        // );

        // if (config.get('app.debug', false)) {
        //     console.log('[Luminix] Backend responded with:', data);
        // }

        // if (data && typeof data === 'object') {
        //     config.merge('boot', data);
        // }

        config.lock('boot');

        this.registerContainer('auth', new Auth(this));
        this.registerContainer('repository', new Repository(this));

        if (config.get('app.debug', false)) {
            console.log('[Luminix] All containers registered:', this.containers);
        }

        runCoreMacros(this.containers);

        const bootablePlugins = plugins.filter(p => typeof p.boot === 'function');
        // Boot plugins
        for (const plugin of bootablePlugins) {
            if (config.get('app.debug', false)) {
                console.log(`[Luminix] Booting plugin: "${plugin.name}"`);
            }
            (plugin.boot as Function)(this.containers);
            if (config.get('app.debug', false)) {
                console.log(`[Luminix] Plugin "${plugin.name}" booted`);
            }
        }

        // Boot custom macros
        if (typeof macros === 'function') {
            macros(this.containers);
            if (config.get('app.debug', false)) {
                console.log('[Luminix] User-defined macros booted');
            }
        }

        if (config.get('app.debug', false)) {
            console.log('[Luminix] App boot completed');
            console.log(' + App Configuration:', config.all());
            console.log(` + Number of plugins: ${plugins.length}`);
            console.log(' + Models loaded:', Object.keys(config.get('boot.models', {})).join(', '));
            console.log(' + Routes available:', Object.keys(config.get('boot.routes', {})).join(', '));
            if (!this.getContainer('auth').check()) {
                console.log('[Luminix] User is not authenticated');
            } else {
                console.log('[Luminix] User is authenticated');
                console.log(' + User:', this.getContainer('auth').user());
            }
        }

        return this.containers;
    }
}
