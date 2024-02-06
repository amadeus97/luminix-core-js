

import axios from 'axios';
import { AuthCredentials } from '../types/Auth';
import { Model } from '../types/Model';

import App from './App';

import route from '../helpers/route';

export default class Auth {

    private _user: Model | undefined;

    constructor(
        private readonly app: App
    ) { }

    async attempt(credentials: AuthCredentials, remember: boolean = false) {
        const { data, status } = await axios({
            url: route('login'),
            method: 'post',
            data: {
                ...credentials,
                remember
            }
        });

        if (![200, 201].includes(status)) {
            throw new Error('Login failed');
        }

        // this method is not fully implemented
        const config = this.app.getContainer('config');

        if (config.get('app.debug', false)) {
            console.warn('Auth.attempt() is not fully implemented');
        }

        return data;
    }

    check() {
        const config = this.app.getContainer('config');

        return !!config.get('boot.data.user');
    }

    logout() {
        const logoutForm = document.querySelector('form#logout-form');
        if (!(logoutForm instanceof HTMLFormElement)) {
            throw new Error('Logout form not found');
        }
        logoutForm.submit();
    }

    user(): Model | null {
        if (!this._user) {
            const { repository, config } = this.app.getContainers();

            const User = repository.getModelClass('user');
            const userData = config.get('boot.data.user');

            if (!userData) {
                return null;
            }

            this._user = new User(userData); 
        }
        return this._user;
    }

    id(): number {
        return this.user()?.id || 0;
    }
}
