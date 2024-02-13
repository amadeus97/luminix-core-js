import App from '../src/facades/App';
import { AppFacade } from '../src/types/App';
import makeConfig from './config';
import mockAxios from 'axios';

describe('testing models', () => {

    test('model create', async () => {
        const app: AppFacade = new App();

        await app.boot({ config: makeConfig() });

        const User = app.make('repository').make('user');

        (mockAxios as any).post.mockImplementationOnce(() => Promise.resolve({ data: { id: 1, name: 'John Doe', email: 'johndoe@example.com' }, status: 200 }));

        const user = await User.create({
            name: 'John Doe',
            email: 'johndoe@example.com'
        });

        expect(mockAxios.post).toHaveBeenCalledWith('/api/luminix/users', { name: 'John Doe', email: 'johndoe@example.com' });
        expect(user.id).toBe(1);

    });

    test('model update', async () => {
        const app: AppFacade = new App();

        await app.boot({ config: makeConfig() });

        const User = app.make('repository').make('user');

        (mockAxios as any).post.mockImplementationOnce(() => Promise.resolve({ data: { id: 1, name: 'John Doe', email: 'johndoe@example.com' }, status: 200 }));

        const user = await User.update(1, {
            name: 'John Doe',
            email: 'johndoe@example.com'
        });

        expect(mockAxios.post).toHaveBeenCalledWith('/api/luminix/user/1', { name: 'John Doe', email: 'johndoe@example.com' });
        expect(user.id).toBe(1);

    });

    test('model delete', async () => {
        const app: AppFacade = new App();

        await app.boot({ config: makeConfig() });

        const User = app.make('repository').make('user');

        (mockAxios as any).delete.mockImplementationOnce(() => Promise.resolve({ status: 200 }));

        await User.delete(1);

        expect(mockAxios.delete).toHaveBeenCalledWith('/api/luminix/user/1');

    });

    test('model fetch and save', async () => {
        const app: AppFacade = new App();

        await app.boot({ config: makeConfig() });

        const User = app.make('repository').make('user');

        (mockAxios as any).get.mockImplementationOnce(() => Promise.resolve({
            data: {
                id: 1,
                name: 'John Doe',
                email: 'johndoe@example.com'
            }
        }));

        const user = await User.find(1);

        expect(mockAxios.get).toHaveBeenCalledWith('/api/luminix/user/1');

        user.name = 'Jane Doe';

        (mockAxios as any).post.mockImplementationOnce(() => Promise.resolve({
            data: {
                id: 1,
                name: 'Jane Doe',
                email: 'johndoe@example.com'
            },
            status: 200 
        }));

        await user.save();

        expect(mockAxios.post).toHaveBeenCalledWith('/api/luminix/user/1', { name: 'Jane Doe' });

    });

    test('model restore and force delete', async () => {
        const app: AppFacade = new App();

        await app.boot({ config: makeConfig() });

        const User = app.make('repository').make('user');

        (mockAxios as any).post.mockImplementationOnce(() => Promise.resolve({ status: 200 }));

        await User.restore(1);

        expect(mockAxios.post).toHaveBeenCalledWith('/api/luminix/user/1/restore');

        (mockAxios as any).delete.mockImplementationOnce(() => Promise.resolve({ status: 200 }));

        await User.forceDelete(1);

        expect(mockAxios.delete).toHaveBeenCalledWith('/api/luminix/user/1/force');

    });

    test('model mass delete, restore and force delete', async () => {
        const app: AppFacade = new App();

        await app.boot({ config: makeConfig() });

        const User = app.make('repository').make('user');

        (mockAxios as any).delete.mockImplementationOnce(() => Promise.resolve({ status: 200 }));
        await User.massDelete([1, 2, 3]);
        expect(mockAxios.delete).toHaveBeenCalledWith('/api/luminix/users/delete', { params: { ids: [1, 2, 3] } });

        (mockAxios as any).post.mockImplementationOnce(() => Promise.resolve({ status: 200 }));
        await User.massRestore([1, 2, 3]);
        expect(mockAxios.post).toHaveBeenCalledWith('/api/luminix/users/restore', { ids: [1, 2, 3] });

        (mockAxios as any).delete.mockImplementationOnce(() => Promise.resolve({ status: 200 }));
        await User.massForceDelete([1, 2, 3]);
        expect(mockAxios.delete).toHaveBeenCalledWith('/api/luminix/users/force', { params: { ids: [1, 2, 3] } });

        const Post = app.make('repository').make('post');

        const post = new Post({ id: 1 });

        await expect(post.forceDelete()).rejects.toThrow("Route data for 'luminix.post.forceDelete' was not found.");

    });

    test('model fillable attributes are respected', async () => {
        const app: AppFacade = new App();

        await app.boot({ config: makeConfig() });

        const User = app.make('repository').make('user');

        const user = new User({
            id: 1,
            name: 'John Doe',
            email: 'johndoe@example.com',
        });

        user.fill({
            foo: 'bar'
        });

        expect(() => user.foo = 'bar').toThrow();

        expect(user.diff()).toEqual({});

        user.fill({
            name: 'Jane Doe',
            password: 'password',
            foo: 'bar',
            test: 'test'
        });

        expect(user.diff()).toEqual({ name: 'Jane Doe', password: 'password' });        

        expect(user.json()).toEqual({
            id: 1,
            name: 'Jane Doe',
            email: 'johndoe@example.com',
            password: 'password',
            avatar_src: null,
            created_at: null,
            updated_at: null,
            deleted_at: null
        });

    });

    test('model relationships', async () => {
        const app: AppFacade = new App();

        await app.boot({ config: makeConfig() });

        const repository = app.make('repository');

        const models = repository.make();

        const { user: User, post: Post, comment: Comment } = models;
    
        const user = new User({
            id: 1,
            name: 'John Doe',
            posts: [
                {
                    id: 1,
                    title: 'First Post',
                    comments: [
                        {
                            id: 1,
                            body: 'First Comment'
                        }
                    ]
                }
            ]
        });

        expect(user.id).toBe(1);
        expect(user.name).toBe('John Doe');
        expect(user.posts[0].id).toBe(1);
        expect(user.posts[0].title).toBe('First Post');
        expect(user.posts[0].comments[0].id).toBe(1);
        expect(user.posts[0].comments[0].body).toBe('First Comment');

        expect(user.posts[0]).toBeInstanceOf(Post);
        expect(user.posts[0].comments[0]).toBeInstanceOf(Comment);

    });


});
