import app from './app';

import { ConfigHelper } from '../types/Config';

const config: ConfigHelper = (path?, defaultValue?) => {
    const configInstance = app('config');
    if (typeof path !== 'string') {
        return configInstance;
    }
    return configInstance.get(path as string, defaultValue);
}

export default config;
