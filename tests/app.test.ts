// import makeConfig from './config';
import mockAxios from 'axios';

import App from '../src/facades/App';
import Auth from '../src/facades/Auth';
import Log from '../src/facades/Log';
import ModelFacade from '../src/facades/Model';
import { AppFacade } from '../src/types/App';
import { AuthFacade } from '../src/types/Auth';

import PropertyBag from '../src/contracts/PropertyBag';
import Plugin from '../src/contracts/Plugin';

describe('testing application', () => {

    test('app boot', async () => {
        const app = new App();

        await app.boot();
        expect(app.plugins().length).toBe(0);
        expect(app.make('auth')).toBeInstanceOf(Auth);
        expect(app.make('config')).toBeInstanceOf(PropertyBag);
        expect(app.make('log')).toBeInstanceOf(Log);
        expect(app.make('model')).toBeInstanceOf(ModelFacade);

        expect(mockAxios.get).toHaveBeenCalledWith('/luminix-api/init');

    });

    test('facades can be added', async () => {
        const app = new App();

        app.bind('foo', 'bar');
        expect(app.make('foo')).toBe('bar');
    });

    test('plugins can replace facades', async () => {
        const app = new App();
        const auth = {} as AuthFacade;

        const plugin: Plugin = {
            name: 'test',
            register(application: AppFacade) {
                application.bind('auth', auth);
            },
            boot() {
            }
            
        };

        app.on('init', ({ register }) => {
            register(plugin);
        });

        await app.boot();

        expect(app.make('auth')).toBe(auth);
    });

    test('facades cant be replaced after boot', async () => {
        const app = new App();

        await app.boot();

        app.bind('auth', {} as AuthFacade);

        expect(app.make('auth')).toBeInstanceOf(Auth);
    });

    test('boot method actions are running', async () => {
        const app = new App();

        const init = jest.fn();
        const booting = jest.fn();
        const booted = jest.fn();


        app.on('init', init);
        app.on('booting', booting);
        app.on('booted', booted);

        await app.boot();

        expect(init).toHaveBeenCalledTimes(1);
        expect(init).toHaveBeenCalledWith({ 
            source: app,
            register: expect.any(Function) 
        });

        expect(booting).toHaveBeenCalledTimes(1);
        expect(booting).toHaveBeenCalledWith({ 
            source: app,
        });

        expect(booted).toHaveBeenCalledTimes(1);
        expect(booted).toHaveBeenCalledWith({ 
            source: app,
        });
    });

});
