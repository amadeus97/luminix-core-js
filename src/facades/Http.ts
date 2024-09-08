import {
    Client, HasFacadeAccessor, MakeFacade, MacroableOf,
} from '@luminix/support';


import App from './App';

class HttpFacade implements HasFacadeAccessor
{
    getFacadeAccessor(): string | object {
        return 'http';
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HttpMacro = (...args: any) => Client;

const Http = MakeFacade<Client, InstanceType<MacroableOf<typeof HttpFacade, Record<string, HttpMacro>>> & HasFacadeAccessor>(HttpFacade, App);

export default Http;
