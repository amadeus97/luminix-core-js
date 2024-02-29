import { AppFacades, AppFacade, AppEvents } from '../types/App';

import Auth from './Auth';
import Log from './Log';
import Macro from './Macro';
import Repository from './Repository';
import Route from './Route';

import Plugin from '../contracts/Plugin';
import PropertyBag from '../contracts/PropertyBag';
import axios from 'axios';
import reader from '../helpers/reader';
import EventSource from '../contracts/EventSource';

export default class App extends EventSource<AppEvents> implements AppFacade {

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

        // Boot macros
        

        const { 
            config: configObject = {}, 
            plugins = [],
            skipBootRequest = false
        } = options;

        if (configObject?.app?.debug) {
            console.log('[Luminix] Booting started...');
        }

        this._plugins = plugins;

        this.bind('macro', new Macro(this));

        const registrablePlugins = plugins.filter(p => typeof p.register === 'function');
        for (const plugin of registrablePlugins) {
            (plugin.register as Function)(this);
        }

        this.bind('log', new Log(this));
        this.bind('config', new PropertyBag(configObject));

        const { config, log: logger } = this.facades;

        this.emit('init');
        
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
        this.bind('repository', new Repository(this));
        
        const bootablePlugins = plugins.filter(p => typeof p.boot === 'function');
        // Boot plugins
        for (const plugin of bootablePlugins) {
            (plugin.boot as Function)(this.facades);
        }

        const { auth } = this.facades;

        logger.info('[Luminix] App boot completed', {
            config: config.all(),
            plugins: plugins,
            authenticated: auth.check(),
            user: auth.user(),
        });

        this.emit('booted');

        return this.facades;
    }
}
