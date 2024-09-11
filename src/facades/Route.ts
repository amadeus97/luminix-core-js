import { HasFacadeAccessor, MakeFacade, ReducibleInterface } from '@luminix/support';
import { RouteService } from '../services/RouteService';
import App from './App';
import { RouteReducers } from '../types/Route';

class RouteFacade implements HasFacadeAccessor
{
    getFacadeAccessor(): string | object {
        return 'route';    
    }
}

const Route = MakeFacade<RouteService & RouteReducers & ReducibleInterface<RouteReducers>, RouteFacade>(RouteFacade, App);

export default Route;
