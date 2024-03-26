import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ReducibleInterface } from './Reducer';

export type RouteReplacer = { [key: string]: string | number };

export type RouteFacade = ReducibleInterface & {
    get(name: string): RouteTuple;
    url(generator: RouteGenerator): string;
    exists(name: string): boolean;
    call(generator: RouteGenerator, config?: AxiosRequestConfig): Promise<AxiosResponse>;
    methods(generator: RouteGenerator): HttpMethod[];
}

export type RouteGenerator = string | [string, RouteReplacer];

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type RouteTuple = [string, ...HttpMethod[]];

export type RouteDefinition = {
    [routeName: string]: RouteTuple | RouteDefinition;
}

export type RouteCallConfig = Omit<AxiosRequestConfig, 'url'> & {
    errorBag?: string;
};
