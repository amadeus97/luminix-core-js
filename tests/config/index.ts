
import { Obj } from '@luminix/support';

import app from './app';
import manifest from './manifest.json';

import { AppConfiguration } from '../../src/types/Config';

export default () => Obj.merge({ app, manifest }) as unknown as AppConfiguration;
