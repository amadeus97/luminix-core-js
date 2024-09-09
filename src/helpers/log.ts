/* eslint-disable @typescript-eslint/no-explicit-any */

import app from './app';
import { LogFacade } from '../types/Log';
import { FacadeOf, HasFacadeAccessor } from '@luminix/support';

function log(): FacadeOf<LogFacade, HasFacadeAccessor>;
function log(...data: any[]): void;
function log(...data: any[]) {
    const logFacade = app('log');

    if (!data.length) {
        return logFacade;
    }

    return logFacade.debug(...data);
}

export default log;