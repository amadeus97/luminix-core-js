import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ReducibleInterface } from './Reducer';

export type RouteReplacer = { [key: string]: string | number };

export type RouteFacade = ReducibleInterface & {
    get(name: string): RouteTuple;
    url(generator: RouteGenerator): string;
    exists(name: string): boolean;
    call(generator: RouteGenerator, config?: AxiosRequestConfig): Promise<AxiosResponse>;
}

export type RouteGenerator = string | [string, RouteReplacer];

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type RouteTuple = [string, ...HttpMethod[]];

export type RouteDefinition = {
    [routeName: string]: RouteTuple | RouteDefinition;
}
