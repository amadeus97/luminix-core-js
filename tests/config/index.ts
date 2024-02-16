import _ from 'lodash';
import { AppConfiguration } from '../../src/types/Config';
import app from './app';
import boot from './boot.json'

export default () => _.cloneDeep({ app, boot }) as unknown as AppConfiguration;
