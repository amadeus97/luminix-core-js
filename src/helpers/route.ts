import app from './app';

import { RouteReplacer } from "../types/Route";

const route = (name: string, replace: RouteReplacer = false) => {
    return app('route').get(name, replace);
};

route.exists = (name: string) => app('route').exists(name);

export default route;
