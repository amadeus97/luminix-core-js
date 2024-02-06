
import config from './config';

/**
 * A helper function for console.log. Will only log if app.debug is set to true.
 *
 * @param message 
 * @param args 
 */
const log = (message: string, ...args: any[]) => {
    if (config('app.debug', false)) {
        console.log(message, ...args);
    }
};

export default log;
