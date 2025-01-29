/* eslint-disable @typescript-eslint/no-explicit-any */

import { axios as mockAxios } from '@luminix/support';

import App from '../src/facades/App';

import makeConfig from './config';

import AuthService from '../src/services/AuthService';

App.withConfiguration(makeConfig());
App.create();

beforeEach(() => {
    jest.resetModules();
});

const auth = App.make('auth');

describe('testing authentication', () => {

    /**
     * @toReview
     */
    test.skip('auth check works', async () => {
        expect(auth).toBeInstanceOf(AuthService);

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({
            data: { auth: { user: { id: 1 } } } 
        }));

        expect(auth.check()).toBe(true);
        expect(auth.id()).toBe(1);
    });

    /**
     * @toReview
     */
    test.skip('auth check fails', async () => {
        expect(auth).toBeInstanceOf(AuthService);

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({
            data: { auth: { user: null } } 
        }));

        expect(auth.check()).toBe(false);
        expect(auth.id()).toBeNull();
    });

    /**
     * @toReview
     */
    test.skip('auth user works', async () => {
        expect(auth).toBeInstanceOf(AuthService);

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({
            data: { auth: { user: { id: 1, name: 'John Doe' } } } 
        }));

        expect(auth.check()).toBe(true);

        const user = auth.user();

        if (!user) {
            throw new Error('User not found');
        }

        expect(user.id).toBe(1);
        expect(user.name).toBe('John Doe');
    });

    test('auth attempt works', async () => {
        expect(auth).toBeInstanceOf(AuthService);

        const onSubmit = jest.fn((e) => e.preventDefault());

        auth.attempt({
            email: 'test@foo.com',
            password: 'password'
        }, true, onSubmit);

        // a form should exist with the login route in the DOM
        const form = document.querySelector('form');

        expect(form).toBeInstanceOf(HTMLFormElement);
        expect(form?.getAttribute('action')).toBe('/login');
        expect(onSubmit).toHaveBeenCalled();

        form?.remove();
    });

    test('auth logout works', async () => {
        expect(auth).toBeInstanceOf(AuthService);

        auth.logout(jest.fn((e) => e.preventDefault()));

        // a form should exist with the logout route in the DOM
        const form = document.querySelector('form');

        expect(form).toBeInstanceOf(HTMLFormElement);
        expect(form?.getAttribute('action')).toBe('/logout');

        form?.remove();
    });

});
