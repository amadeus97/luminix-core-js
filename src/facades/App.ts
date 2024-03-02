import { AppFacades, AppFacade, AppEvents } from '../types/App';

import Auth from './Auth';
import Log from './Log';
import Repository from './Repository';
import Route from './Route';

import Plugin from '../contracts/Plugin';
import PropertyBag from '../contracts/PropertyBag';
import axios from 'axios';
import reader from '../helpers/reader';
import EventSource from '../contracts/EventSource';

class App extends EventSource<AppEvents> implements AppFacade {

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

    readonly boot: AppFacade['boot'] = async (options = {}) => {

        if (this.booted) {
            throw new Error('[Luminix] App already booted');
        }
        this.booted = true;

        const {
            config: configObject = {},
            skipBootRequest = false
        } = options;

        if (configObject?.app?.debug) {
            console.log('[Luminix] Booting started...');
        }

        const register = (plugin: Plugin) => {
            this._plugins.push(plugin);
            plugin.register(this);
        }

        this.emit('init', { register });

        this.bind('log', new Log(this));
        this.bind('config', new PropertyBag(configObject));

        const { config, log: logger } = this.facades;
        
        if (!skipBootRequest && !document.querySelector('#luminix-embed #luminix-data-boot')) {
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

        this.bind('route', new Route(this));
        this.bind('auth', new Auth(this));
        this.bind('repository', new Repository(configObject?.boot?.models || {}));

        this.emit('booting');

        Object.values(this.facades).forEach((facade) => {
            if (typeof facade.boot === 'function') {
                facade.boot(this);
            }
        });

        // Boot plugins
        for (const plugin of this._plugins) {
            plugin.boot(this.facades);
        }

        logger.info('[Luminix] App boot completed', {
            config: config.all(),
            plugins: this._plugins,
        });

        this.emit('booted');

        return this.facades;
    }
    
}

export default App;
