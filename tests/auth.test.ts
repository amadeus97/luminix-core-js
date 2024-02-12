import App from '../src/facades/App';
import Auth from '../src/facades/Auth';
import makeConfig from './config';
import mockAxios from 'axios';

describe('testing authentication', () => {

    test('auth check works', async () => {
        const app = new App();
        const config = makeConfig();

        (mockAxios as any).get.mockImplementationOnce(() => Promise.resolve({ data: { data: { user: { id: 1 } } } }));

        await app.boot({ config });

        expect(app.make('auth')).toBeInstanceOf(Auth);

        const auth = app.make('auth');

        expect(auth.check()).toBe(true);
        expect(auth.id()).toBe(1);

    });

    test('auth check fails', async () => {
        const app = new App();
        const config = makeConfig();

        (mockAxios as any).get.mockImplementationOnce(() => Promise.resolve({ data: { data: { user: null } } }));

        await app.boot({ config });

        expect(app.make('auth')).toBeInstanceOf(Auth);

        const auth = app.make('auth');

        expect(auth.check()).toBe(false);
        expect(auth.id()).toBe(0);

    });

    test('auth user works', async () => {
        const app = new App();
        const config = makeConfig();

        (mockAxios as any).get.mockImplementationOnce(() => Promise.resolve({ data: { data: { user: { id: 1, name: 'John Doe' } } } }));

        await app.boot({ config });

        expect(app.make('auth')).toBeInstanceOf(Auth);

        const auth = app.make('auth');

        const user = auth.user();

        expect(user.id).toBe(1);
        expect(user.name).toBe('John Doe');

    });

});


