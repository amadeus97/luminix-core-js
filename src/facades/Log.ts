import { LogFacade } from "../types/Log";
import { AppFacade } from "../types/App";

export default class Log implements LogFacade {

    constructor(
        private app: AppFacade,
    ) { 
    }

    public emergency(...args: any[]) {
        if (this.app.make('config').get('app.debug', false)) {
            console.error(...args);
        }
    }

    public alert(...args: any[]) {
        if (this.app.make('config').get('app.debug', false)) {
            console.error(...args);
        }
    }

    public critical(...args: any[]) {
        if (this.app.make('config').get('app.debug', false)) {
            console.error(...args);
        }
    }

    public error(...args: any[]) {
        if (this.app.make('config').get('app.debug', false)) {
            console.error(...args);
        }
    }

    public warning(...args: any[]) {
        if (this.app.make('config').get('app.debug', false)) {
            console.warn(...args);
        }
    }

    public notice(...args: any[]) {
        if (this.app.make('config').get('app.debug', false)) {
            console.info(...args);
        }
    }

    public info(...args: any[]) {
        if (this.app.make('config').get('app.debug', false)) {
            console.info(...args);
        }
    }

    public debug(...args: any[]) {
        if (this.app.make('config').get('app.debug', false)) {
            console.debug(...args);
        }
    }
}



