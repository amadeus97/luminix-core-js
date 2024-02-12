// import makeConfig from './config';
import mockAxios from 'axios';

import App from '../src/facades/App';
import Auth from '../src/facades/Auth';
import Config from '../src/facades/Config';
import Log from '../src/facades/Log';
import Macro from '../src/facades/Macro';
import Repository from '../src/facades/Repository';

describe('testing application', () => {

    test('app boot', async () => {
        const app = new App();

        await app.boot();
        expect(app.plugins().length).toBe(0);
        expect(app.make('auth')).toBeInstanceOf(Auth);
        expect(app.make('config')).toBeInstanceOf(Config);
        expect(app.make('log')).toBeInstanceOf(Log);
        expect(app.make('macro')).toBeInstanceOf(Macro);
        expect(app.make('repository')).toBeInstanceOf(Repository);

        expect(mockAxios.get).toHaveBeenCalledWith('/api/luminix/init');

    });

    test('facades can be added', async () => {
        const app = new App();

        app.add('foo', 'bar');
        expect(app.make('foo')).toBe('bar');
    });

    test('plugins can replace facades', async () => {
        const app = new App();

        const plugin = {
            name: 'test',
            register: (application: App) => {
                application.add('auth', 'bar');
            }
        };

        await app.boot({
            plugins: [plugin]
        });

        expect(app.make('auth')).toBe('bar');
    });

    test('facades cant be replaced after boot', async () => {
        const app = new App();

        await app.boot();

        app.add('auth', 'bar');

        expect(app.make('auth')).toBeInstanceOf(Auth);
    });

    test('boot method actions are running', async () => {
        const app = new App();

        const macro = {
            doAction: jest.fn(),
            getActions: jest.fn(() => []),
            getFilters: jest.fn(() => [])
        };

        app.add('macro', macro);

        await app.boot();

        expect(macro.doAction).toHaveBeenCalledTimes(2);
        expect(macro.doAction).toHaveBeenCalledWith('init', app);
        expect(macro.doAction).toHaveBeenCalledWith('booted', app.make());
    });

});
