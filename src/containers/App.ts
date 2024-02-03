import axios from "axios";

import { Plugin } from "../types/Plugin";

import Config from "./Config";
import Macro from "./Macro";

import runCoreMacros from '../macros';
import Repository from "./Repository";
import Auth from "./Auth";

export default class App {

    private containers: { [key: string]: any } = {};
    private plugins: Plugin[] = [];
    private macros?: Function;

    getContainer(key: string) {
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
            throw new Error(`[Luminix] Container already exists: ${key}`);
        }
        this.containers[key] = container;
    }

    withPlugins(plugins: Plugin[]): App {
        if (this.plugins.length > 0) {
            throw new Error('[Luminix] Plugins already added. Use app().withPlugins() only once.');
        }
        this.plugins = plugins;
        return this;
    }

    withConfig(config: any): App {
        this.registerContainer('config', new Config(config));
        return this;
    }

    withMacros(macros: Function): App {
        if (typeof this.macros === 'function') {
            throw new Error('[Luminix] Macros already added. Use app().withMacros() only once.');
        }
        this.macros = macros;
        return this;
    }

    async boot(): Promise<App> {

        // Boot macros
        const macro = new Macro();
        this.registerContainer('macro', macro);

        let config = this.getContainer('config') as Config;

        if (!config) {
            config = new Config();
            this.registerContainer('config', config);
        }

        const { data } = await axios.get(
            config.get('app.bootUrl', '/api/luminix/init')
        );

        if (data) {
            config.set('boot', {
                ...config.get('boot'),
                ...data
            });
        }

        this.registerContainer('auth', new Auth(this));
        this.registerContainer('repository', new Repository(this));

        runCoreMacros(this);

        // Boot plugins
        for (const plugin of this.plugins) {
            plugin.boot(this);
        }

        // Boot custom macros
        if (typeof this.macros === 'function') {
            this.macros(this);
        }

        if (config.get('app.setupAxios', false)) {
            axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
            axios.defaults.withCredentials = true;
        }

        return this;
    }
}
