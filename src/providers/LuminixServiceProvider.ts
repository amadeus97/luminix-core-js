import { ServiceProvider, Obj, PropertyBag, Client, } from '@luminix/support';

import AuthService from '../services/AuthService';
import ErrorService from '../services/ErrorService';
import LogService from '../services/LogService';
import ModelService from '../services/ModelService';
import RouteService from '../services/RouteService';

export default class LuminixServiceProvider extends ServiceProvider
{

    protected flushReady?: () => void;

    register(): void {

        this.app.singleton('auth', () => {
            return new AuthService(this.app);
        });


        this.app.singleton('config', () => {
            const config = new PropertyBag(Obj.omit(this.app.configuration, 'manifest'));

            if (!config.has('auth.user')) {
                config.set('auth.user', null);
            }

            config.lock('auth.user');

            return config;
        });

        this.app.singleton('error', () => {
            return new ErrorService();
        });

        this.app.bind('http', () => {
            return new Client();
        });

        this.app.singleton('log', () => {
            return new LogService(this.app.configuration.app?.debug ?? false);    
        });

        this.app.singleton('model', () => {
            return new ModelService(
                this.app.configuration.manifest?.models ?? {},
            );
        });

        this.app.singleton('route', () => {
            return new RouteService(
                this.app.configuration.manifest?.routes ?? {},
                this.app.make('error'),
                this.app.configuration.app?.url
            );
        });

        this.flushReady = this.app.on('ready', () => {
            this.app.make('log').info('[Luminix] App boot completed', this.app);
        });

    }


    flush(): void {
        if (this.flushReady) {
            this.flushReady();
            delete this.flushReady;
        }
    }


}

