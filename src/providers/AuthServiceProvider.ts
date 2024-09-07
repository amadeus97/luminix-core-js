import { ServiceProvider } from '@luminix/support';

import AuthService from '../services/AuthService';


export default class AuthServiceProvider extends ServiceProvider
{
    register(): void {
        this.app.singleton('auth', () => {
            return new AuthService(this.app);
        });
    }
}
