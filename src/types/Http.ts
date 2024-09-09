/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, MacroableInterface, RequestOptions, Response } from '@luminix/support';

export type HttpMacro = (...args: any) => Client;

export type HttpFacade = Record<string, HttpMacro> &
    MacroableInterface<Record<string, HttpMacro>> &
{
    getClient(): Client;
    baseUrl(baseUrl: string): Client;
    asForm(): Client;
    accept(type: string): Client;
    acceptJson(): Client;
    withHeaders(headers: Record<string, string>): Client;
    withOptions(options: RequestOptions): Client;
    withData(data: object): Client;
    withQueryParameters(params: string | object): Client;
    withBasicAuth(username: string, password: string): Client;
    withToken(token: string): Client;
    get<TResponse = any>(url: string, query?: string | object): Promise<Response<TResponse>>;
    post<TResponse = any, TData = any>(url: string, data?: TData): Promise<Response<TResponse>>;
    put<TResponse = any, TData = any>(url: string, data?: TData): Promise<Response<TResponse>>;
    patch<TResponse = any, TData = any>(url: string, data?: TData): Promise<Response<TResponse>>;
    delete<TResponse = any>(url: string, query?: string | object): Promise<Response<TResponse>>;
};

