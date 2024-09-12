import { Obj, Reducible, Client, Response, isValidationError } from '@luminix/support';

import {
    RouteReplacer, RouteDefinition, RouteTuple as RouteTuple, HttpMethod, RouteGenerator,
    RouteReducers
} from '../types/Route';

import { ErrorFacade } from '../types/Error';

import NotReducibleException from '../exceptions/NotReducibleException';
import RouteNotFoundException from '../exceptions/RouteNotFoundException';

export class RouteService
{
    constructor(
        protected routes: RouteDefinition,
        protected error: ErrorFacade,
        protected http: () => Client,
        protected appUrl: string = '',
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
        return Obj.get(this.routes, name) as RouteTuple;
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
        return Obj.has(this.routes, name)
            && this.isRouteTuple(Obj.get(this.routes, name));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async call<TResponse = any>(generator: RouteGenerator, tap: (client: Client) => Client = (client) => client, errorBag = 'default'): Promise<Response<TResponse>>
    {
        if (typeof this.clientOptions !== 'function' || typeof this.clientError !== 'function') {
            throw new NotReducibleException('RouteFacade');
        }
        const [name, replace] = this.extractGenerator(generator);
        
        const [, ...methods] = this.get(name);
        const url = this.url(replace ? [name, replace] : name);

        const client = tap(this.http());
        
        // !Reducer `clientOptions`
        const clientOptions = this.clientOptions({}, name);

        if (!Obj.isEmpty(clientOptions)) {
            client.withOptions(clientOptions);
        }

        const method = methods[0] ?? clientOptions.method;

        this.error.clear(errorBag);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: Response = await (client as any)[method](url);

        if (isValidationError(response)) {
            const errors = response.json('errors');

            this.error.set(Object.entries(errors).reduce((acc, [key, value]) => {
                acc[key] = value.join(' ');
                return acc;
            }, {} as Record<string,string>), errorBag);

        } else if (response.failed()) {
            this.error.set(
                this.clientError({ axios: response.json('message') }, { 
                    response, name, replace, client
                }),
                errorBag
            );
        }
        
        return response;
    }

    toString()
    {
        return 'route';
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [reducer: string]: unknown;
}

export default Reducible<RouteReducers, typeof RouteService>(RouteService);
