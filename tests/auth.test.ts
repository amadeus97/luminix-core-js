import App from '../src/facades/App';
import Auth from '../src/facades/Auth';
import { AppFacade } from '../src/types/App';
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

        if (!user) {
            throw new Error('User not found');
        }

        expect(user.id).toBe(1);
        expect(user.name).toBe('John Doe');

    });

    test('auth attempt works', async () => {
        const app = new App();
        const config = makeConfig();

        

        await app.boot({ config });

        expect(app.make('auth')).toBeInstanceOf(Auth);

        const auth = app.make('auth');

        (mockAxios as any).post.mockImplementationOnce(() => Promise.resolve({ status: 200 }));
        await auth.attempt({
            email: 'test@foo.com',
            password: 'password'
        }, true);

        expect(mockAxios.post).toHaveBeenCalledWith('/login', { email: 'test@foo.com', password: 'password', remember: true });

    });

    test('auth logout works', async () => {
        const app: AppFacade = new App();
        const config = makeConfig();

        await app.boot({ config });

        expect(app.make('auth')).toBeInstanceOf(Auth);

        const auth = app.make('auth');
        auth.logout(jest.fn((e) => e.preventDefault()));

        // a form should exist with the logout route in the DOM
        const form = document.querySelector('form');
        expect(form).toBeInstanceOf(HTMLFormElement);
        expect(form?.getAttribute('action')).toBe('/logout');

    });

});


