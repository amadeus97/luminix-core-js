import axios from "axios";

import Config from "./Config";
import Macro from "./Macro";

import runCoreMacros from '../macros';
import Repository from "./Repository";
import Auth from "./Auth";

import { AppContainers, BootOptions } from "../types/App";

export default class App {
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

        for (const plugin of plugins) {
            plugin.register && plugin.register(this);
        }

        // Boot macros
        this.registerContainer('macro', new Macro());

        // let config = this.getContainer('config') as Config;
        const config = new Config(configObject);

        this.registerContainer('config', config);

        const { data } = await axios.get(
            config.get('app.bootUrl', '/api/luminix/init')
        );

        if (data && typeof data === 'object') {
            config.merge('boot', data);
        }

        config.lock('boot');

        this.registerContainer('auth', new Auth(this));
        this.registerContainer('repository', new Repository(this));

        runCoreMacros(this.containers);

        // Boot plugins
        for (const plugin of plugins) {
            plugin.boot && plugin.boot(this.containers);
        }

        // Boot custom macros
        if (typeof macros === 'function') {
            macros(this.containers);
        }

        return this.containers;
    }
}
