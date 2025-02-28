/* eslint-disable @typescript-eslint/no-explicit-any */

import { ServiceProvider } from '@luminix/support';

export class HttpServiceProvider extends ServiceProvider {

    public boot(): void {
        //
    }

    public register(): void {
        this.app.singleton('http', () => mockHttpService as any);
    }

}

const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    //
    withQueryParameters: jest.fn(function () {
        return this;
    }),
    withData: jest.fn(function () {
        return this;
    }),
};

export default mockHttpService;
