import app from './app';

import { RouteFacade, RouteReplacer } from "../types/Route";

function route(): RouteFacade;
function route(name: string, parameters?: RouteReplacer): string;
function route(name?: string, parameters?: RouteReplacer) {
    const route = app('route');
    if (!name) {
        return route;
    }

    return route.get(name, parameters);
}

export default route;
