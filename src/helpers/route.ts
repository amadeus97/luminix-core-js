import app from './app';

import { RouteFacade, RouteReplacer } from '../types/Route';

function route(): RouteFacade;
function route(name: string, parameters?: RouteReplacer): string;
function route(name?: string, parameters: RouteReplacer | false = false) {
    const route = app('route');
    if (!name) {
        return route;
    }
    if (!parameters) {
        return route.url(name);
    }
    return route.url([name, parameters]);
}

export default route;
