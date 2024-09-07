import { ReducibleInterface, Response, Client, RequestOptions } from '@luminix/support';

export type RouteReplacer = { [key: string]: string | number };

export type RouteReducers = {
    clientOptions(config: RequestOptions,  routeName: string): RequestOptions;
    clientError(
        errors: Record<string, string>,
        event: {
            response: Response,
            name: string,
            replace: RouteReplacer,
            client: Client,
        },
    ): Record<string, string>;
    replaceRouteParams(url: string): string;
};

export type RouteFacade = ReducibleInterface<RouteReducers> & {
    get(name: string): RouteTuple;
    url(generator: RouteGenerator): string;
    exists(name: string): boolean;
    call<TResponse = unknown>(generator: RouteGenerator, tap?: (client: Client) => Client): Promise<Response<TResponse>>;
    methods(generator: RouteGenerator): HttpMethod[];
}

export type RouteGenerator = string | [string, RouteReplacer];

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type RouteTuple = [string, ...HttpMethod[]];

export type RouteDefinition = {
    [routeName: string]: RouteTuple | RouteDefinition;
}
