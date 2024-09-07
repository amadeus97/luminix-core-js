import {
    Client, HasFacadeAccessor, Macroable, MakeFacade,
    MacroableOf,
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

const MakeHttpFacade = MakeFacade<Client, InstanceType<MacroableOf<typeof HttpFacade, Record<string, HttpMacro>>> & HasFacadeAccessor>;
const HttpMacroable = Macroable<Record<string, HttpMacro>, typeof HttpFacade>;

const Http = MakeHttpFacade(HttpMacroable(HttpFacade), App);

export default Http;
