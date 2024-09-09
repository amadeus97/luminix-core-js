import {
    HasFacadeAccessor, MakeFacade, MacroableOf,
} from '@luminix/support';

import App from './App';
import { HttpService } from '../services/HttpService';
import { HttpMacro } from '../types/Http';

class HttpFacade implements HasFacadeAccessor
{
    getFacadeAccessor(): string | object {
        return 'http';
    }
}


const Http = MakeFacade<HttpService, InstanceType<MacroableOf<typeof HttpFacade, Record<string, HttpMacro>>> & HasFacadeAccessor>(HttpFacade, App);

export default Http;
