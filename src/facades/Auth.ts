

import { AuthCredentials, AuthFacade } from '../types/Auth';
import { JsonObject, Model } from '../types/Model';

import { AppFacade } from '../types/App';

export default class Auth implements AuthFacade {

    private _user: Model | undefined;

    constructor(
        private readonly app: AppFacade
    ) { }

    attempt(credentials: AuthCredentials, remember: boolean = false, onSubmit?: (e: Event) => void) {
        const form = document.createElement('form');

        form.method = 'post';
        form.action = this.app.make('route').url('login');
        form.style.display = 'none';

        const csrfToken = this.app.make('config').get('auth.csrf');

        if (typeof csrfToken === 'string') {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;

            form.appendChild(csrfInput);
        }

        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.name = 'email';
        emailInput.value = credentials.email;
        form.appendChild(emailInput);

        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.name = 'password';
        passwordInput.value = credentials.password;
        form.appendChild(passwordInput);

        if (remember) {
            const rememberInput = document.createElement('input');
            rememberInput.type = 'checkbox';
            rememberInput.name = 'remember';
            rememberInput.value = '1';
            rememberInput.checked = true;
            form.appendChild(rememberInput);
        }

        if (onSubmit) {
            form.addEventListener('submit', onSubmit);
        }

        document.body.appendChild(form);
        form.submit();
        
    }

    check() {
        const config = this.app.make('config');

        return !!config.get('auth.user');
    }

    logout(onSubmit?: (e: Event) => void) {
        // Append a form to the document and submit it
        const form = document.createElement('form');

        form.method = 'post';
        form.action = this.app.make('route').url('logout');
        form.style.display = 'none';

        const csrfToken = this.app.make('config').get('auth.csrf');

        if (typeof csrfToken === 'string') {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = '_token';
            input.value = csrfToken;

            form.appendChild(input);
        }
        document.body.appendChild(form);

        if (onSubmit) {
            form.addEventListener('submit', onSubmit);
        }

        form.submit();
    }

    user(): Model | null {
        if (!this._user) {
            const { model, config } = this.app.make();

            const User = model.make('user');
            const userData = config.get('auth.user');

            if (!userData) {
                return null;
            }

            this._user = new User(userData as JsonObject); 
        }
        return this._user;
    }

    id(): number | string | null {
        return this.user()?.getKey() || null;
    }
}
