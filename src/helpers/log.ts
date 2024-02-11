
import app from './app';
import { LogHelper } from '../types/Log';

const log = ((...data: any[]) => {
    const logFacade = app('log');
    if (data.length === 0) {
        return logFacade;
    }
    logFacade.info(...data);
}) as LogHelper;

export default log;
