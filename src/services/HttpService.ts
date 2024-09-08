import {
    Client, RequestOptions, Macroable,
} from '@luminix/support';


class HttpService {

    getClient(): Client {
        return new Client();
    }

    baseUrl(baseUrl: string): Client {
        return this.getClient().baseUrl(baseUrl);
    }

    asForm(): Client {
        return this.getClient().asForm();
    }

    accept(type: string): Client {
        return this.getClient().accept(type);
    }

    acceptJson(): Client {
        return this.getClient().acceptJson();
    }

    withHeaders(headers: Record<string, string>): Client {
        return this.getClient().withHeaders(headers);
    }

    withOptions(options: RequestOptions): Client {
        return this.getClient().withOptions(options);
    }

    withData(data: object): Client {
        return this.getClient().withData(data);
    }

    withQueryParameters(params: string | object): Client {
        return this.getClient().withQueryParameters(params);
    }

    withBasicAuth(username: string, password: string): Client {
        return this.getClient().withBasicAuth(username, password);
    }

    withToken(token: string): Client {
        return this.getClient().withToken(token);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get<TResponse = any>(url: string, query?: string | object) {
        return this.getClient().get<TResponse>(url, query);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    post<TResponse = any, TData = any>(url: string, data?: TData) {
        return this.getClient().post<TResponse, TData>(url, data);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    put<TResponse = any, TData = any>(url: string, data?: TData) {
        return this.getClient().put<TResponse, TData>(url, data);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    patch<TResponse = any, TData = any>(url: string, data?: TData) {
        return this.getClient().patch<TResponse, TData>(url, data);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete<TResponse = any>(url: string, query?: string | object) {
        return this.getClient().delete<TResponse>(url, query);
    }

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default Macroable<Record<string, (...args: any) => Client>, typeof HttpService>(HttpService);
