import app from './app';

import { ConfigFacade } from '../types/Config';

function config(): ConfigFacade;
function config(path: string, defaultValue?: any): any;
function config(path?: string, defaultValue?: any) {
    const configInstance = app('config');
    if (typeof path === 'undefined') {
        return configInstance;
    }
    return configInstance.get(path, defaultValue);
}

export default config;
