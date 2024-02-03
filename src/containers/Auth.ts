

import { Model } from '../types/Model';

import App from './App';
import Config from './Config';
import Repository from './Repository';

export default class Auth {

    private _user: Model | undefined;

    constructor(
        private readonly app: App
    ) { }

    logout() {
        const logoutForm = document.querySelector('form#logout-form');
        if (!(logoutForm instanceof HTMLFormElement)) {
            throw new Error('Logout form not found');
        }
        logoutForm.submit();
    }

    user(): Model {
        if (!this._user) {
            const repository = this.app.getContainer('repository') as Repository;
            const config = this.app.getContainer('config') as Config;

            const User = repository.getModelClass('user');
            const userData = config.get('boot.data.user');

            this._user = new User(userData); 
        }
        return this._user;
    }

    can(permission: string|string[], every = false): boolean {
        if (Array.isArray(permission)) {
            if (!every) {
                return permission.some(p => this.can(p));
            }
            return permission.every(p => this.can(p));
        }
        return this.user().roles.some((role: any) => role.permissions.some((p: any) => p.name === permission));
    }

    id(): number {
        return this.user().id;
    }
}
