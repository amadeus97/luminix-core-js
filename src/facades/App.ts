import { AppFacades, AppFacade, AppEvents } from '../types/App';

import Auth from './Auth';
import Log from './Log';
import Repository from './Repository';
import Route from './Route';

import Plugin from '../contracts/Plugin';
import PropertyBag from '../contracts/PropertyBag';
import axios from 'axios';
import reader from '../helpers/reader';
import { HasEvents } from '../mixins/HasEvents';
import { AppConfiguration } from '../types/Config';
import { Unsubscribe } from 'nanoevents';
import { RouteDefinition } from '../types/Route';
import { ModelSchema } from '../types/Model';
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

        const bootUrl = config.get('app.bootUrl', '/luminix-api/init');
        
        if (typeof bootUrl === 'string' && !!bootUrl && !document.getElementById('luminix-data::config')) {
            const { data } = await axios.get(bootUrl);
            if (data && typeof data === 'object') {
                config.merge('.', data);
            }
        }
        if (document.getElementById('luminix-data::config')) {
            const data = reader('config');
            if (data && typeof data === 'object') {
                config.merge('.', data);
            }
        }
        if (!config.has('auth.user')) {
            config.set('auth.user', null);
        }
        if (!config.has('manifest')) {
            config.set('manifest', {});
        }
        config.lock('manifest');
        config.lock('auth.user');

        this.bind('route', new Route(config.get('manifest.routes', {}) as RouteDefinition));
        this.bind('repository', new Repository(config.get('manifest.models', {}) as ModelSchema));
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
            config: config.all(),
            plugins: this._plugins,
        });

        this.emit('booted');

        return this.facades;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    on<E extends keyof AppEvents>(_: E, __: AppEvents[E]): Unsubscribe {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    once<E extends keyof AppEvents>(_: E, __: AppEvents[E]): void {
        throw new Error('Method not implemented.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    emit<E extends keyof AppEvents>(_: E, __?: Omit<Parameters<AppEvents[E]>[0], 'source'>): void {
        throw new Error('Method not implemented.');
    }

}

export default HasEvents<AppEvents, typeof App>(App);
