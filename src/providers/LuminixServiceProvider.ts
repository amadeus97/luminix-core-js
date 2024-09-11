import { ServiceProvider, Obj, PropertyBag } from '@luminix/support';

import AuthService from '../services/AuthService';
import ErrorService from '../services/ErrorService';
import LogService from '../services/LogService';
import ModelService from '../services/ModelService';
import RouteService from '../services/RouteService';
import HttpService from '../services/HttpService';


export default class LuminixServiceProvider extends ServiceProvider
{

    [Symbol.toStringTag] = 'LuminixServiceProvider';

    register(): void {

        this.registerServices();
        this.registerMacros();

        this.app.on('ready', () => {
            this.app.dump('[Luminix] App boot completed');
        });
    }

    boot(): void {
        this.app.make('model').boot(this.app);
    }

    registerServices() {

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

    }


    registerMacros() {

        this.app.macro('environment', (...environments: string[]) => {
            if (environments.length > 0) {
                return environments.includes(this.app.make('config').get('app.env', 'production'));
            }
            return this.app.make('config').get('app.env', 'production') as string;
        });

        this.app.macro('getLocale', () => {
            return this.app.make('config').get('app.locale', 'en') as string;
        });

        this.app.macro('hasDebugModeEnabled', () => {
            return this.app.make('config').get('app.debug', false) as boolean;
        });

        this.app.macro('isLocal', () => {
            return this.app.make('config').get('app.env', 'production') === 'local';
        });

        this.app.macro('isProduction', () => {
            return this.app.make('config').get('app.env', 'production') === 'production';
        });

    }
}

