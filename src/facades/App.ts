import { HasFacadeAccessor, Application, MakeFacade } from '@luminix/support';

import { AppFacades } from '../types/App';

import LuminixServiceProvider from '../providers/LuminixServiceProvider';

let application: Application;

class AppFacade implements HasFacadeAccessor
{

    getFacadeAccessor(): string | object {

        if (!application) {
            application = Application.provides([
                LuminixServiceProvider,
            ]);
        }

        return application;
    }
    

    environment(): string;
    environment(...environments: string[]): boolean;
    environment(...rest: unknown[]): string | boolean {
        if (rest.length > 0) {
            return rest.includes(application.make('config').get('app.env', 'production'));
        }
        return application.make('config').get('app.env', 'production') as string;
    }

    getLocale(): string {
        return application.make('config').get('app.locale', 'en') as string;
    }

    hasDebugModeEnabled(): boolean {
        return application.make('config').get('app.debug', false) as boolean;
    }

    isLocal(): boolean {
        return application.make('config').get('app.env', 'production') === 'local';
    }

    isProduction(): boolean {
        return application.make('config').get('app.env', 'production') === 'production';
    }
}

const App = MakeFacade<Application<AppFacades>, AppFacade>(AppFacade);

export default App;

// class App extends EventSource<AppEvents> implements AppFacade {
    

//     private facades: AppFacades = {} as AppFacades;
//     private booted = false;
//     private _plugins: Plugin[] = [];

//     make(): AppFacades;
//     make<K extends keyof AppFacades>(key: K): AppFacades[K];
//     make(key = undefined) {
//         if (!key) {
//             return this.facades;
//         }
//         if (key in this.facades) {
//             return this.facades[key];
//         }
//         return undefined;
//     }

//     has(key: string) {
//         return !!this.facades[key];
//     }

//     bind<K extends keyof AppFacades>(key: K, facade: AppFacades[K]) {
//         if (this.facades[key]) {
//             return;
//         }
//         this.facades[key] = facade;
//     }

//     plugins() {
//         return this._plugins;
//     }

//     async boot(configObject: AppConfiguration = {}) {

//         if (this.booted) {
//             throw new window.Error('[Luminix] App already booted');
//         }
//         this.booted = true;

//         if (configObject.app?.debug) {
//             console.log('[Luminix] Booting started...');
//         }

//         this.emit('init', { 
//             register: (plugin) => {
//                 this._plugins.push(plugin);
//                 if (typeof plugin.register === 'function') {
//                     plugin.register(this);
//                 }
//             },
//             source: this,
//         });

//         const bootUrl = (configObject.app?.url ?? '') + (configObject.app?.bootUrl ?? '/luminix-api/init');
        
//         if (!document.getElementById('luminix-data::config')) {
//             const response = await Http.get(bootUrl);
//             if (response.successful()) {
//                 Obj.merge(configObject, response.json());
//             }
//         } else if (document.getElementById('luminix-data::config')) {
//             const data = reader('config');
//             if (data && typeof data === 'object') {
//                 Obj.merge(configObject, data);
//             }
//         }

//         this.bind('log', new Log(!!configObject.app?.debug));
        
//         const { log: logger } = this.facades;


//         const {
//             manifest: { routes = {}, models = {} } = {},
//             ...config
//         } = configObject;

//         this.bind('config', new PropertyBag(config));

//         if (!this.facades.config.has('auth.user')) {
//             this.facades.config.set('auth.user', null);
//         }

//         this.facades.config.lock('auth.user');

//         const url = new URL(configObject.app?.url ?? 'http://localhost');
//         const port = configObject.app?.port ?? '';

//         if (port) {
//             url.port = `${port}`;
//         }
        
//         this.bind('error', new Error());
//         this.bind('route', new Route(routes, this.facades.error, Str.trim(url.toString(), '/')));
//         this.bind('model', new Model(models));
//         this.bind('auth', new Auth(this));

//         this.emit('booting', { source: this });

//         // Boot facades
//         for (const facade of Object.values(this.facades)) {
//             if (typeof facade === 'object' 
//                 && facade !== null 
//                 && 'boot' in facade
//                 && typeof facade.boot === 'function') {
//                 facade.boot(this);
//             }
//         }

//         // Boot plugins
//         for (const plugin of this._plugins) {
//             if (typeof plugin.boot === 'function') {
//                 plugin.boot(this.facades);
//             }
//         }

//         logger.info('[Luminix] App boot completed', {
//             config: this.facades.config.all(),
//             plugins: this._plugins,
//             manifest: {
//                 routes,
//                 models,
//             }
//         });

//         this.emit('booted', { source: this });

//         return this.facades;
//     }


// }

// export default App;
