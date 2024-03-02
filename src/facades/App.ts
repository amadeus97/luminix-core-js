import { AppFacades, AppFacade, AppEvents } from '../types/App';

import Auth from './Auth';
import Log from './Log';
import Repository from './Repository';
import Route from './Route';

import Plugin from '../contracts/Plugin';
import PropertyBag from '../contracts/PropertyBag';
import axios from 'axios';
import reader from '../helpers/reader';
import { HasEvents } from '../contracts/HasEvents';
class App implements AppFacade {

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

    readonly boot: AppFacade['boot'] = async (configObject = {}) => {

        if (this.booted) {
            throw new Error('[Luminix] App already booted');
        }
        this.booted = true;

        if (configObject?.app?.debug) {
            console.log('[Luminix] Booting started...');
        }

        this.emit('init', { 
            register: (plugin: Plugin) => {
                this._plugins.push(plugin);
                if (typeof plugin.register === 'function') {
                    plugin.register(this);
                }
            }
        });

        this.bind('log', new Log(!!configObject?.app?.debug));
        this.bind('config', new PropertyBag(configObject));

        const { config, log: logger } = this.facades;
        
        if (config.get('app.bootUrl', '/luminix-api/init') && !document.querySelector('#luminix-embed #luminix-data-boot')) {
            const { data } = await axios.get(config.get('app.bootUrl', '/luminix-api/init'));
            if (data && typeof data === 'object') {
                config.merge('boot', data);
            }
        }
        if (document.querySelector('#luminix-embed #luminix-data-boot')) {
            const data = reader('boot');
            if (data && typeof data === 'object') {
                config.merge('boot', data);
            }
        }
        config.lock('boot');

        this.bind('route', new Route(configObject?.boot?.routes || {}));
        this.bind('repository', new Repository(configObject?.boot?.models || {}));
        this.bind('auth', new Auth(this));

        this.emit('booting');

        // Boot facades
        for (const facade of Object.values(this.facades)) {
            if (typeof facade.boot === 'function') {
                facade.boot(this);
            }
        }

        // Boot plugins
        for (const plugin of this._plugins) {
            if (typeof plugin.boot === 'function') {
                plugin.boot(this.facades);
            }
        }

        logger.info('[Luminix] App boot completed', {
            config: config.all(),
            plugins: this._plugins,
        });

        this.emit('booted');

        return this.facades;
    }

    on<E extends keyof AppEvents>(_: E, __: AppEvents[E]): void {}
    once<E extends keyof AppEvents>(_: E, __: AppEvents[E]): void {}
    emit<E extends keyof AppEvents>(_: E, __?: Omit<Parameters<AppEvents[E]>[0], "source">): void {}
}

export default HasEvents<AppEvents, typeof App>(App);
