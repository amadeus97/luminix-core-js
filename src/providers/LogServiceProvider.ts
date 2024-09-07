import { ServiceProvider } from '@luminix/support';
import LogService from '../services/LogService';



export default class LogServiceProvider extends ServiceProvider {

    protected flushReady?: () => void;

    register(): void {
        this.app.singleton('log', () => {
            return new LogService(this.app.configuration.app?.debug ?? false);    
        });

        this.flushReady = this.app.on('ready', () => {
            this.app.make('log').info('[Luminix] App boot completed', this.app);
        });
    }

    flush(): void {
        if (this.flushReady) {
            this.flushReady();
            delete this.flushReady;
        }
    }

}


