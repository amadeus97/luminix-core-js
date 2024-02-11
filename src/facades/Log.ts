import { LogFacade } from "../types/Log";
import { AppFacade } from "../types/App";

export default class Log implements LogFacade {

    private enabled: boolean;

    constructor(
        private app: AppFacade,
    ) { 
        this.enabled = this.app.make('config').get('app.debug', false);
    }

    public emergency(...args: any[]) {
        if (this.enabled) {
            console.error(...args);
        }
    }

    public alert(...args: any[]) {
        if (this.enabled) {
            console.error(...args);
        }
    }

    public critical(...args: any[]) {
        if (this.enabled) {
            console.error(...args);
        }
    }

    public error(...args: any[]) {
        if (this.enabled) {
            console.error(...args);
        }
    }

    public warning(...args: any[]) {
        if (this.enabled) {
            console.warn(...args);
        }
    }

    public notice(...args: any[]) {
        if (this.enabled) {
            console.info(...args);
        }
    }

    public info(...args: any[]) {
        if (this.enabled) {
            console.info(...args);
        }
    }

    public debug(...args: any[]) {
        if (this.enabled) {
            console.debug(...args);
        }
    }
}



