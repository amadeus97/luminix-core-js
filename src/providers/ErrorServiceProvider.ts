import { ServiceProvider } from '@luminix/support';

import ErrorService from '../services/ErrorService';

export default class ErrorServiceProvider extends ServiceProvider
{
    register(): void {
        this.app.singleton('error', () => {
            return new ErrorService();
        });
    }
}
