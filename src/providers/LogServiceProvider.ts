import { ServiceProvider } from '@luminix/support';
import LogService from '../services/LogService';



export default class LogServiceProvider extends ServiceProvider {

    protected flushReady?: () => void;

    register(): void {        

        // bind the logger to the container
        this.app.singleton('log', () => {
            return new LogService(this.app.configuration.app?.debug ?? false);    
        });

        // log the 'ready' event
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


