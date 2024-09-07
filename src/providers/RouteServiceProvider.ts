import { ServiceProvider } from '@luminix/support';
import RouteService from '../services/RouteService';

export default class RouteServiceProvider extends ServiceProvider
{
    register(): void {
        this.app.singleton('route', () => {
            return new RouteService(
                this.app.configuration.manifest?.routes ?? {},
                this.app.make('error'),
                this.app.configuration.app?.url
            );
        });
    }
}
