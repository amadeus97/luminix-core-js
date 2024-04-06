import _ from 'lodash';
import {
    RouteReplacer, RouteDefinition, RouteTuple as RouteTuple, HttpMethod, RouteGenerator, RouteCallConfig
} from '../types/Route';
import axios from 'axios';
import { Reducible } from '../mixins/Reducible';
import { ErrorFacade } from '../types/Error';
import { isValidationError } from './Error';
import NotReducibleException from '../exceptions/NotReducibleException';
import RouteNotFoundException from '../exceptions/RouteNotFoundException';

class Route {


    constructor(
        private routes: RouteDefinition,
        private error: ErrorFacade,
        private appUrl: string = '',
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
            throw new RouteNotFoundException(name);
        }
        return _.get(this.routes, name) as RouteTuple;
    }

    url(generator: RouteGenerator): string {
        const [name, replace] = this.extractGenerator(generator);
        // Remove leading and trailing slashes
        const url = this.get(name)[0].replace(/^\/|\/$/g, '');

        const regex = /{([^}]+)}/g;

        if (replace === false) {
            if (typeof this.replaceRouteParams !== 'function') {
                throw new NotReducibleException('RouteFacade');
            }
            // !Reducer `replaceRouteParams`
            return this.appUrl + this.replaceRouteParams(`/${url}`);
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

        return this.appUrl + `/${newPath}`;
    }

    methods(generator: RouteGenerator): HttpMethod[] {
        const [name] = this.extractGenerator(generator);
        return this.get(name).slice(1) as HttpMethod[];
    }

    exists(name: string) {
        return _.has(this.routes, name)
            && this.isRouteTuple(_.get(this.routes, name));
    }

    async call(generator: RouteGenerator, config: RouteCallConfig = {}) {
        if (typeof this.axiosOptions !== 'function' || typeof this.axiosError !== 'function') {
            throw new NotReducibleException('RouteFacade');
        }
        const [name, replace] = this.extractGenerator(generator);
        
        const [, ...methods] = this.get(name);
        const url = this.url(replace ? [name, replace] : name);
        
        // !Reducer `axiosOptions`
        const axiosOptions = this.axiosOptions(config, name);
        
        const { method = methods[0], errorBag = 'route.call', ...rest } = axiosOptions;
        const { data, ...restOfRest } = rest;

        this.error.clear(errorBag);

        try {
            const response = ['get', 'delete'].includes(method)
                ? await axios[method as HttpMethod](url, rest)
                : await axios[method as HttpMethod](url, data, restOfRest);
            
            return response;
        } catch (error: unknown) {
            if (isValidationError(error)) {
                const { errors } = error.response.data;

                this.error.set(Object.entries(errors).reduce((acc, [key, value]) => {
                    acc[key] = value.join(' ');
                    return acc;
                }, {} as Record<string,string>));
            } else if (axios.isAxiosError(error)) {
                this.error.set(
                    this.axiosError({ axios: error.message }, { 
                        error, name, replace, config
                    }),
                    errorBag
                );
            }
            throw error;
        }
    }

    toString()
    {
        return 'route';
    }
    
    [reducer: string]: unknown;

}

export default Reducible(Route);

