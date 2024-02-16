import objectPath from "object-path";
import { AppFacade } from "../types/App";
import {
    RouteFacade, RouteReplacer, RouteDefinition, RouteTuple as RouteTuple, HttpMethod, RouteGenerator
} from "../types/Route";
import axios, { AxiosRequestConfig } from "axios";

export default class Route implements RouteFacade {

    private routes: RouteDefinition;

    constructor(
        private readonly app: AppFacade,
    ) {
        this.routes = this.app.make('config').get('boot.routes');
    }

    private isRouteTuple(route: any): route is RouteTuple {
        // Check if route is an array with exactly two elements
        if (!Array.isArray(route) || route.length !== 2) {
            return false;
        }

        const [path, methods] = route;

        if (!Array.isArray(methods) || methods.length === 0) {
            return false;
        }

        // Check if path is a string and follows a valid URL pattern
        // const pathRegex = /^\/[a-zA-Z0-9/]*(\{[a-zA-Z0-9]+\})*$/;
        const pathRegex = /^\/?[a-zA-Z0-9\/]*(\{[a-zA-Z0-9]+\})*$/;
        if (typeof path !== 'string' || !pathRegex.test(path)) {
            return false;
        }

        // Check if method is a valid HTTP method
        const validMethods: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete'];
        if (!methods.every((method: string) => validMethods.includes(method as HttpMethod))) {
            return false;
        }

        return true;
    }

    private extractGenerator(generator: RouteGenerator): [string, RouteReplacer | false] {
        let name: string, replace: false | RouteReplacer = false;
        if (Array.isArray(generator)) {
            [name, replace] = generator;
        } else {
            name = generator;
        }

        return [name, replace];
    }

    get(name: string): RouteTuple {
        if (!this.exists(name)) {
            throw new Error(`Route data for '${name}' was not found.`);
        }
        return objectPath.get(this.routes, name);
    }

    url(generator: RouteGenerator): string {
        const [name, replace] = this.extractGenerator(generator);
        // Remove leading and trailing slashes
        const url = this.get(name)[0].replace(/^\/|\/$/g, '');

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
        return objectPath.has(this.routes, name)
            && this.isRouteTuple(objectPath.get(this.routes, name));
    }

    call(generator: RouteGenerator, config: AxiosRequestConfig = {}) {
        const [name, replace] = this.extractGenerator(generator);

        const [_, methods] = this.get(name);
        const url = this.url(replace ? [name, replace] : name);

        const { method = methods[0], ...rest } = config;

        if (['get', 'delete'].includes(method)) {
            return axios[method.toLowerCase() as HttpMethod](url, config);
        }

        const { data, ...restOfRest } = rest;

        return axios[method.toLowerCase() as HttpMethod](url, data, restOfRest);
    }
    

};

