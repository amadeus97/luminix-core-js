import App from '../src/facades/App';

import makeConfig from './config';
import mockAxios from 'axios';


describe('testing builder', () => {

    test('builder use cases', async () => {
        const app = new App();

        await app.boot(makeConfig());

        const User = app.make('repository').make('user');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mockAxios as any).get.mockImplementationOnce(() => Promise.resolve({
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
        }));

        const users = await User.where('branch_id', 1)
            .where('role_id', [1, 2, 3])
            .orderBy('name')
            .searchBy('doe')
            .minified()
            .get();

        expect(users.data.length).toBe(2);
        expect(mockAxios.get).toHaveBeenCalledWith('/api/luminix/users', {
            params: {
                filters: JSON.stringify({
                    branch_id: 1,
                    role_id: [1, 2, 3],
                }),
                minified: true,
                order_by: 'name:asc',
                page: 1,
                per_page: 15,
                q: 'doe',
            }
        });


    });
});

