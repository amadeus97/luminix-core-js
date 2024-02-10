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
            console.error('[Emergency]', ...args);
        }
    }

    public alert(...args: any[]) {
        if (this.enabled) {
            console.warn('[Alert]', ...args);
        }
    }

    public critical(...args: any[]) {
        if (this.enabled) {
            console.error('[Critical]', ...args);
        }
    }

    public error(...args: any[]) {
        if (this.enabled) {
            console.error('[Error]', ...args);
        }
    }

    public warning(...args: any[]) {
        if (this.enabled) {
            console.warn('[Warning]', ...args);
        }
    }

    public notice(...args: any[]) {
        if (this.enabled) {
            console.info('[Notice]', ...args);
        }
    }

    public info(...args: any[]) {
        if (this.enabled) {
            console.info('[Info]', ...args);
        }
    }

    public debug(...args: any[]) {
        if (this.enabled) {
            console.debug('[Debug]', ...args);
        }
    }

    public log(...args: any[]) {
        if (this.enabled) {
            console.log(...args);
        }
    }
}



