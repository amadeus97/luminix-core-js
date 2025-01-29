// import _ from 'lodash';
import { cloneDeep } from 'lodash-es';

import app from './app';
import manifest from './manifest.json';

import { AppConfiguration } from '../../src/types/Config';

// export default () => _.cloneDeep({ app, manifest }) as unknown as AppConfiguration;
export default () => cloneDeep({ app, manifest }) as unknown as AppConfiguration;
