import { HasFacadeAccessor, MakeFacade, PropertyBag } from '@luminix/support';

import App from './App';
import { AppConfiguration } from '../types/Config';

class ConfigFacade implements HasFacadeAccessor
{
    getFacadeAccessor(): string | object {
        return 'config';    
    }
}

const Config = MakeFacade<PropertyBag<AppConfiguration>, ConfigFacade>(ConfigFacade, App);

export default Config;
