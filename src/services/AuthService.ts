
import { JsonObject, PropertyBag } from '@luminix/support';
 
import { AuthCredentials } from '../types/Auth';
import { Model } from '../types/Model';

import { AppConfiguration } from '../types/Config';
import { ModelFacade } from '../types/App';
import { RouteFacade } from '../types/Route';

export default class AuthService {

    protected _user: Model | undefined;

    constructor(
        protected config: PropertyBag<AppConfiguration>,
        protected model: ModelFacade,
        protected route: RouteFacade,
    ) {}

    attempt(credentials: AuthCredentials, remember: boolean = false, onSubmit?: (e: Event) => void) {
        const form = document.createElement('form');

        form.method = 'post';
        form.action = this.route.url('login');
        form.style.display = 'none';

        const csrfToken = this.config.get('auth.csrf');

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
        return !!this.config.get('auth.user');
    }

    logout(onSubmit?: (e: Event) => void) {
        // Append a form to the document and submit it
        const form = document.createElement('form');

        form.method = 'post';
        form.action = this.route.url('logout');
        form.style.display = 'none';

        const csrfToken = this.config.get('auth.csrf');

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

    user(): Model | undefined {
        if (!this._user) {
            const User = this.model.make('user');
            const userData = this.config.get('auth.user');

            if (!userData) {
                return;
            }

            this._user = new User(userData as JsonObject); 
        }
        return this._user;
    }

    id(): number | string | null {
        return this.user()?.getKey() || null;
    }
}
