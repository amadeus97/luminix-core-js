import { AppFacades, AppFacade, AppEvents } from '../types/App';

import Auth from './Auth';
import Log from './Log';
import Repository from './Repository';
import Route from './Route';

import Plugin from '../contracts/Plugin';
import PropertyBag from '../contracts/PropertyBag';
import axios from 'axios';
import reader from '../support/reader';
import { HasEvents } from '../mixins/HasEvents';
import { AppConfiguration } from '../types/Config';
import { Unsubscribe } from 'nanoevents';
import _ from 'lodash';
import Error from './Error';

class App implements AppFacade {

    private facades: AppFacades = {} as AppFacades;
    private booted = false;
    private _plugins: Plugin[] = [];

    make(): AppFacades;
    make<K extends keyof AppFacades>(key: K): AppFacades[K];
    make(key = undefined) {
        if (!key) {
            return this.facades;
        }
        if (key in this.facades) {
            return this.facades[key];
        }
        return undefined;
    }

    has(key: string) {
        return !!this.facades[key];
    }

    bind<K extends keyof AppFacades>(key: K, facade: AppFacades[K]) {
        if (this.facades[key]) {
            return;
        }
        this.facades[key] = facade;
    }

    plugins() {
        return this._plugins;
    }

    async boot(configObject: AppConfiguration = {}) {

        if (this.booted) {
            throw new window.Error('[Luminix] App already booted');
        }
        this.booted = true;

        if (configObject.app?.debug) {
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

        this.bind('log', new Log(!!configObject.app?.debug));
        
        const { log: logger } = this.facades;

        const bootUrl = configObject.app?.bootUrl ?? '/luminix-api/init';
        
        if (typeof bootUrl === 'string' && !!bootUrl && !document.getElementById('luminix-data::config')) {
            const { data } = await axios.get(bootUrl);
            if (data && typeof data === 'object') {
                _.merge(configObject, data);
            }
        } else if (document.getElementById('luminix-data::config')) {
            const data = reader('config');
            if (data && typeof data === 'object') {
                _.merge(configObject, data);
            }
        }

        const {
            manifest: { routes = {}, models = {} } = {},
            ...config
        } = configObject;

        this.bind('config', new PropertyBag(config));

        if (!this.facades.config.has('auth.user')) {
            this.facades.config.set('auth.user', null);
        }

        this.facades.config.lock('auth.user');
        
        this.bind('error', new Error());
        this.bind('route', new Route(routes, this.facades.error));
        this.bind('repository', new Repository(models));
        this.bind('auth', new Auth(this));

        this.emit('booting');

        // Boot facades
        for (const facade of Object.values(this.facades)) {
            if (typeof facade === 'object' 
                && facade !== null 
                && 'boot' in facade
                && typeof facade.boot === 'function') {
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
            config: this.facades.config.all(),
            plugins: this._plugins,
        });

        this.emit('booted');

        return this.facades;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    on<E extends keyof AppEvents>(_: E, __: AppEvents[E]): Unsubscribe {
        throw new window.Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    once<E extends keyof AppEvents>(_: E, __: AppEvents[E]): void {
        throw new window.Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    emit<E extends keyof AppEvents>(_: E, __?: Omit<Parameters<AppEvents[E]>[0], 'source'>): void {
        throw new window.Error('Method not implemented.');
    }

}

export default HasEvents<AppEvents, typeof App>(App);
