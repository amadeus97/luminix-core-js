import app from './app';

import { AppConfiguration } from '../types/Config';
import PropertyBag from '../contracts/PropertyBag';

function config(): PropertyBag<AppConfiguration>;
function config(path: string, defaultValue?: any): any;
function config(path?: string, defaultValue?: any) {
    const configInstance = app('config');
    if (typeof path === 'undefined') {
        return configInstance;
    }
    return configInstance.get(path, defaultValue);
}

export default config;
