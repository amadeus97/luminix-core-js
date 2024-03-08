import objectPath from 'object-path';
import {
    RouteReplacer, RouteDefinition, RouteTuple as RouteTuple, HttpMethod, RouteGenerator
} from '../types/Route';
import axios, { AxiosRequestConfig } from 'axios';
import { Reducible } from '../mixins/Reducible';

class Route {


    constructor(
        private routes: RouteDefinition
    ) {
    }

    private isRouteTuple(route: unknown): route is RouteTuple {
        // Check if route is an array with two or more elements
        if (!Array.isArray(route) || route.length < 2) {
            return false;
        }

        const [path, ...methods] = route;

        // Check if path is a string
        if (typeof path !== 'string') {
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
            if (typeof this.replaceRouteParams !== 'function') {
                throw new Error('Expect `Route` to be Reducible');
            }
            // !Reducer `replaceRouteParams`
            return this.replaceRouteParams(`/${url}`);
        }

        const matches = url.match(regex);
        const params = matches ? matches.map((match: string) => match.slice(1, -1)) : [];
        const replaceKeys = Object.keys(replace);
        const missingParams = params.filter((param: string) => !replaceKeys.includes(param));
        const extraParams = replaceKeys.filter((key) => !params.includes(key));

        if (missingParams.length > 0) {
            throw new TypeError(`Missing values for parameter(s): ${missingParams.join(', ')}`);
        }

        if (extraParams.length > 0) {
            throw new TypeError(`Unexpected parameters: ${extraParams.join(', ')}`);
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

        const [, ...methods] = this.get(name);
        const url = this.url(replace ? [name, replace] : name);

        const { method = methods[0], ...rest } = config;

        if (['get', 'delete'].includes(method)) {
            return axios[method as HttpMethod](url, config);
        }

        const { data, ...restOfRest } = rest;

        return axios[method as HttpMethod](url, data, restOfRest);
    }

    toString()
    {
        return 'route';
    }
    
    [reducer: string]: unknown;

}

export default Reducible(Route);

