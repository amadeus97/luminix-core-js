import { ServiceProvider, Obj, PropertyBag, } from '@luminix/support';

import AuthService from '../services/AuthService';
import ErrorService from '../services/ErrorService';
import LogService from '../services/LogService';
import ModelService from '../services/ModelService';
import RouteService from '../services/RouteService';
import HttpService from '../services/HttpService';

export default class LuminixServiceProvider extends ServiceProvider
{

    protected flushReady?: () => void;

    register(): void {

        this.app.singleton('auth', () => {
            return new AuthService(
                this.app.make('config'),
                this.app.make('model'),
                this.app.make('route'),
            );
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

        this.app.singleton('http', () => {
            return new HttpService();
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
                () => this.app.make('http'),
                this.app.configuration.app?.url
            );
        });

        this.flushReady = this.app.on('ready', () => {
            this.app.dump('[Luminix] App boot completed');
        });

    }

    boot(): void {
        this.app.make('model').boot(this.app);
    }


    flush(): void {
        if (this.flushReady) {
            this.flushReady();
            delete this.flushReady;
        }
    }


}

