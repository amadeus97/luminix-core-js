import _ from 'lodash';
import { AppConfiguration } from '../../src/types/Config';
import app from './app';
import boot from './boot.json'

export default () => {
    return _.cloneDeep({ app, boot }) as AppConfiguration;
}


