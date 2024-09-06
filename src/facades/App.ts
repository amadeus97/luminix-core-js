import { EventSource, Http, Obj, Str, PropertyBag } from '@luminix/support';

import { AppFacades, AppFacade, AppEvents } from '../types/App';

import Auth from './Auth';
import Log from './Log';
import Model from './Model';
import Route from './Route';

import Plugin from '../contracts/Plugin';


import reader from '../support/reader';

import { AppConfiguration } from '../types/Config';

import Error from './Error';
import { Constructor } from '../types/Support';

class App extends EventSource<AppEvents> implements AppFacade {
    

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
            register: (plugin) => {
                this._plugins.push(plugin);
                if (typeof plugin.register === 'function') {
                    plugin.register(this);
                }
            },
            source: this,
        });

        const bootUrl = (configObject.app?.url ?? '') + (configObject.app?.bootUrl ?? '/luminix-api/init');
        
        if (!document.getElementById('luminix-data::config')) {
            try {
                const response = await Http.get(bootUrl);
                if (response.successful()) {
                    Obj.merge(configObject, response.json());
                }
            } catch (error) {
                if (configObject.app?.debug) {
                    console.error(error);
                }
            }
        } else if (document.getElementById('luminix-data::config')) {
            const data = reader('config');
            if (data && typeof data === 'object') {
                Obj.merge(configObject, data);
            }
        }

        this.bind('log', new Log(!!configObject.app?.debug));
        
        const { log: logger } = this.facades;


        const {
            manifest: { routes = {}, models = {} } = {},
            ...config
        } = configObject;

        this.bind('config', new PropertyBag(config));

        if (!this.facades.config.has('auth.user')) {
            this.facades.config.set('auth.user', null);
        }

        this.facades.config.lock('auth.user');

        const url = new URL(configObject.app?.url ?? 'http://localhost');
        const port = configObject.app?.port ?? '';

        if (port) {
            url.port = `${port}`;
        }
        
        this.bind('error', new Error());
        this.bind('route', new Route(routes, this.facades.error, Str.trim(url.toString(), '/')));
        this.bind('model', new Model(models));
        this.bind('auth', new Auth(this));

        this.emit('booting', { source: this });

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
            manifest: {
                routes,
                models,
            }
        });

        this.emit('booted', { source: this });

        return this.facades;
    }

    environment(): string;
    environment(...environments: string[]): boolean;
    environment(...rest: unknown[]): string | boolean {
        if (rest.length > 0) {
            return rest.includes(this.facades.config.get('app.env', 'production'));
        }
        return this.facades.config.get('app.env', 'production') as string;
    }

    getLocale(): string {
        return this.facades.config.get('app.locale', 'en') as string;
    }

    getPlugin<T extends Plugin>(abstract: Constructor<T>): T | undefined {
        for (const plugin of this._plugins) {
            if (plugin instanceof abstract) {
                return plugin;
            }
        }
        return undefined;
    }

    hasDebugModeEnabled(): boolean {
        return this.facades.config.get('app.debug', false) as boolean;
    }

    isLocal(): boolean {
        return this.facades.config.get('app.env', 'production') === 'local';
    }

    isProduction(): boolean {
        return this.facades.config.get('app.env', 'production') === 'production';
    }

}

export default App;
