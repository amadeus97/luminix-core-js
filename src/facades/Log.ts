import { HasFacadeAccessor, MakeFacade } from '@luminix/support';
import LogService from '../services/LogService';
import App from './App';


class LogFacade implements HasFacadeAccessor
{

    getFacadeAccessor(): string | object {
        return 'log';    
    }

}

const Log = MakeFacade<LogService, LogFacade>(LogFacade, App);

export default Log;
