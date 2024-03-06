import _ from 'lodash';
import { AppConfiguration } from '../../src/types/Config';
import app from './app';
import manifest from './manifest.json';

export default () => _.cloneDeep({ app, manifest }) as unknown as AppConfiguration;
