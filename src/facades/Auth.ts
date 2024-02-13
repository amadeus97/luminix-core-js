

import axios from 'axios';
import { AuthCredentials, AuthFacade } from '../types/Auth';
import { Model } from '../types/Model';

import { AppFacade } from '../types/App';

export default class Auth implements AuthFacade {

    private _user: Model | undefined;

    constructor(
        private readonly app: AppFacade
    ) { }

    async attempt(credentials: AuthCredentials, remember: boolean = false) {
        const { data, status } = await axios.post(this.app.make('route').get('login'), {
            ...credentials,
            remember
        });

        if (![200, 201].includes(status)) {
            throw new Error('Login failed');
        }

        // this method is not fully implemented
        const config = this.app.make('config');

        if (config.get('app.debug', false)) {
            console.warn('Auth.attempt() is not fully implemented');
        }

        return data;
    }

    check() {
        const config = this.app.make('config');

        return !!config.get('boot.data.user');
    }

    logout(onSubmit?: (e: Event) => void) {
        // Append a form to the document and submit it
        const form = document.createElement('form');

        form.method = 'post';
        form.action = this.app.make('route').get('logout');
        form.style.display = 'none';

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = '_token';
        input.value = '';

        form.appendChild(input);
        document.body.appendChild(form);

        if (onSubmit) {
            form.addEventListener('submit', onSubmit);
        }

        form.submit();
    }

    user(): Model | null {
        if (!this._user) {
            const { repository, config } = this.app.make();

            const User = repository.make('user');
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
