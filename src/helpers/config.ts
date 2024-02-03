import app from './app';
import Config from '../containers/Config';

import { ConfigHelper } from '../types/Config';

const config: ConfigHelper = (key?, defaultValue?) => {
    const configInstance = app('config') as Config;
    if (!key) {
        return configInstance;
    }
    return configInstance.get(key as string, defaultValue);
}

export default config;
