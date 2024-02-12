import { AppConfiguration } from '../../src/types/Config';
import app from './app';
import boot from './boot.json'

export default () => {
    return structuredClone({ app, boot }) as AppConfiguration;
}


