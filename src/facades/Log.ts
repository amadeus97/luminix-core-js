import { LogFacade } from "../types/Log";

export default class Log implements LogFacade {

    constructor(
        private _debug: boolean
    ) { 
    }

    public emergency(...args: any[]) {
        if (this._debug) {
            console.error(...args);
        }
    }

    public alert(...args: any[]) {
        if (this._debug) {
            console.error(...args);
        }
    }

    public critical(...args: any[]) {
        if (this._debug) {
            console.error(...args);
        }
    }

    public error(...args: any[]) {
        if (this._debug) {
            console.error(...args);
        }
    }

    public warning(...args: any[]) {
        if (this._debug) {
            console.warn(...args);
        }
    }

    public notice(...args: any[]) {
        if (this._debug) {
            console.info(...args);
        }
    }

    public info(...args: any[]) {
        if (this._debug) {
            console.info(...args);
        }
    }

    public debug(...args: any[]) {
        if (this._debug) {
            console.debug(...args);
        }
    }
}



