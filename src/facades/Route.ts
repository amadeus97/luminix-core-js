import { HasFacadeAccessor, MakeFacade } from '@luminix/support';
import { RouteService } from '../services/RouteService';
import App from './App';

class RouteFacade implements HasFacadeAccessor
{
    getFacadeAccessor(): string | object {
        return 'route';    
    }
}

const Route = MakeFacade<RouteService, RouteFacade>(RouteFacade, App);

export default Route;
