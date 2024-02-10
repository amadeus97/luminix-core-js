
import app from './app';
import { LogHelper } from '../types/Log';

const log = ((...data: any[]) => {
    const logFacade = app('log');
    const config = app('config');

    if (data.length === 0) {
        return logFacade;
    }

    if (config.get('app.debug')) {
        console.log(...data);
    }
}) as LogHelper;

export default log;
