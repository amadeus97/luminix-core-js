/* eslint-disable @typescript-eslint/no-explicit-any */

import { axios as mockAxios } from '@luminix/support';

import App from '../src/facades/App';

import makeConfig from './config';

App.withConfiguration(makeConfig());
App.create();

beforeEach(() => {
    jest.resetModules();
});

const mockedResponse = () => Promise.resolve({
    data: {
        data: [
            {
                id: 2,
                name: 'Jane Doe',
                email: 'janedoe@example.com',
            },
            {
                id: 1,
                name: 'John Doe',
                email: 'johndoe@example.com'
            },
            
        ],
        links: {
            first: 'http://example.com/luminix-api/users?page=1',
            last: 'http://example.com/luminix-api/users?page=1',
            next: null,
            prev: null,
        },
        meta: {
            current_page: 1,
            from: 1,
            last_page: 1,
            path: 'http://example.com/luminix-api/users',
            per_page: 15,
            to: 2,
            total: 2,
            links: [],
        }
    }
});

describe('testing builder', () => {

    test.skip('builder use cases', async () => {

        const User = App.make('model').make('user');

        (mockAxios as any).get.mockImplementationOnce(mockedResponse);

        const users = await User.where('branchId', 1)
            .where('roleId', [1, 2, 3])
            .where('createdAt', '>=', '2021-01-01')
            .orderBy('name')
            .searchBy('doe')
            .minified()
            .all(); // or .get(page) .first() .find() 

        expect(users.count()).toBe(2);
        expect(mockAxios.get).toHaveBeenCalledWith('/api/luminix/users', {
            params: {
                where: {
                    branchId: 1,
                    roleId: [1, 2, 3],
                    createdAtGreaterThanOrEquals: '2021-01-01',
                },
                minified: true,
                order_by: 'name:asc',
                page: 1,
                per_page: 150,
                q: 'doe',
            }
        });
    });

});
