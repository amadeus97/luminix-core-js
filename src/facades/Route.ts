import { AppFacade } from "../types/App";
import { RouteFacade, RouteReplacer } from "../types/Route";

export default class Route implements RouteFacade {

    constructor(
        private readonly app: AppFacade,
    ) { 
    }

    get(name: string, replace: RouteReplacer = false) {

        let url = this.app.make('config').get(`boot.routes.${name}`);

        if (!url) {
            throw new Error(`Route data for '${name}' was not found.`);
        }

        // Remove leading and trailing slashes
        url = url.replace(/^\/|\/$/g, '');

        const regex = /{([^}]+)}/g;

        if (replace === false) {
            const macro = this.app.make('macro');
            return macro.applyFilters('route_without_replace', `/${url}`) as string;
        }

        const matches = url.match(regex);
        const params = matches ? matches.map((match: string) => match.slice(1, -1)) : [];
        const replaceKeys = Object.keys(replace);
        const missingParams = params.filter((param: string) => !replaceKeys.includes(param));
        const extraParams = replaceKeys.filter((key) => !params.includes(key));

        if (missingParams.length > 0) {
            throw new Error(`Missing values for parameter(s): ${missingParams.join(', ')}`);
        }

        if (extraParams.length > 0) {
            throw new Error(`Unexpected parameters: ${extraParams.join(', ')}`);
        }

        const newPath = params.reduce((acc: string, param: string) => acc.replace(`{${param}}`, `${replace[param]}`), url);

        return `/${newPath}`;
    }

    exists(name: string) {
        return !!this.app.make('config').get(`boot.routes.${name}`);
    }
    

};

