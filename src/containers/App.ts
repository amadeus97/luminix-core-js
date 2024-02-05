import axios from "axios";

import Config from "./Config";
import Macro from "./Macro";

import runCoreMacros from '../macros';
import Repository from "./Repository";
import Auth from "./Auth";

import { BootOptions } from "../types/App";

export default class App {

    private containers: { [key: string]: any } = {};
    // private plugins: Plugin[] = [];
    // private macros?: Function;

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

    async boot(options: BootOptions = {}): Promise<App> {

        const { 
            config: configObject = {}, 
            plugins = [], 
            macros = () => null 
        } = options;

        // Boot macros
        const macro = new Macro();
        this.registerContainer('macro', macro);

        // let config = this.getContainer('config') as Config;
        const config = new Config(configObject);

        this.registerContainer('config', config);

        const { data } = await axios.get(
            config.get('app.bootUrl', '/api/luminix/init')
        );

        if (data) {
            config.set('boot', {
                ...config.get('boot'),
                ...data
            });
        }

        config.lock('boot');

        this.registerContainer('auth', new Auth(this));
        this.registerContainer('repository', new Repository(this));

        runCoreMacros(this);

        // Boot plugins
        for (const plugin of plugins) {
            plugin.boot(this);
        }

        // Boot custom macros
        if (typeof macros === 'function') {
            macros(this);
        }

        if (config.get('app.setupAxios', false)) {
            axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
            axios.defaults.withCredentials = true;
        }

        return this;
    }
}
