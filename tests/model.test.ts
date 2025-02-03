/* eslint-disable @typescript-eslint/no-explicit-any */

import { Response, Collection } from '@luminix/support';

import App from '../src/facades/App';
// import Model from '../src/facades/Model';
import Http from '../src/facades/Http';

import { HttpServiceProvider } from './__mocks__/httpservice';
import makeConfig from './config';

// import RouteNotFoundException from '../src/exceptions/RouteNotFoundException';
// import AttributeNotFillableException from '../src/exceptions/AttributeNotFillableException';

App.withProviders([ HttpServiceProvider ])
    .withConfiguration(makeConfig())
    .create();

beforeEach(() => {
    jest.resetModules();
});

function collect<T = unknown>(items: T[]) {
    return new Collection(items);
}

describe('testing models', () => {

    const baseModel = App.make('model');

    const User = baseModel.make('user');
    const Post = baseModel.make('post');
    const Attachment = baseModel.make('attachment');

    const posts = collect([
        new Post({
            id: 1,
            title: 'First Post',
            content: 'foo bar',
            likes: '100',
            user_id: 1,
            user: {
                id: 1,
                name: 'John Doe'
            },
            published_at: '2021-01-01T00:00:00.000Z',
            published: 1,
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: '2021-01-01T00:00:00.000Z',
        }),
        new Post({
            id: 2,
            title: 'Second Post',
            content: 'lorem ipsum',
            likes: '10',
            user_id: 1,
            user: {
                id: 1,
                name: 'John Doe'
            },
            published_at: '2021-01-01T00:00:00.000Z',
            published: 1,
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: null,
        }),
    ]);

    const attachments = collect([
        new Attachment({ 
            id: 1, 
            path: '/path/to/attachment.jpg', 
            type: 'image', 
            author_id: 1, 
            author: {
                id: 1,
                name: 'John Doe'
            },
            attachable: null,
            attachable_type: null,
            attachable_id: null,
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: '2021-01-01T00:00:00.000Z',
        }),
        new Attachment({ 
            id: 2, 
            path: '/path/to/attachment2.jpg', 
            type: 'image', 
            author_id: 1, 
            author: {
                id: 1,
                name: 'John Doe'
            },
            attachable: null,
            attachable_type: null,
            attachable_id: null,
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: '2021-01-01T00:00:00.000Z',
        }),
    ]);

    const users = new User({
        id: 1,
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: null,
        posts: posts.where('user_id', '1').toArray().map((post) => post.toJson()),
        attachments: attachments.where('author_id', '1').toArray().map((attachment) => attachment.toJson()),
        created_at: '2021-01-01T00:00:00.000Z',
        updated_at: '2021-01-01T00:00:00.000Z',
        deleted_at: '2021-01-01T00:00:00.000Z',
    });

    /* * * * */

    test('model create', async () => {
        
        (Http.post as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
            config: {
                headers: { 'Content-Type': 'application/json' } as any,
            },
            data: { id: 1 }, 
            headers: { 'Content-Type': 'application/json' },
            status: 200, 
            statusText: 'OK',
        })));

        const user1 = await User.create({
            name: 'John Doe',
            email: 'johndoe@example.com',
        });

        expect(Http.post).toHaveBeenCalledTimes(1);
        expect(Http.post).toHaveBeenCalledWith('/api/luminix/users');
        expect(Http.withData).toHaveBeenCalledWith({
            name: 'John Doe',
            email: 'johndoe@example.com',
            password: null,
        });

        expect(user1.id).toBe(1);

        /* * */

        const user2 = new User();

        expect(user2.id).toBeUndefined();
    });

    /**
     * @toReview
     */
    test.skip('model update', async () => {

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({ 
            data: { id: 1, name: 'John Doe', email: 'johndoe@example.com' }, 
            status: 200 
        }));

        const user = await User.update(1, {
            name: 'John Doe',
            email: 'johndoe@example.com'
        });

        expect(mockAxios.put).toHaveBeenCalledWith('/api/luminix/users/1', { name: 'John Doe', email: 'johndoe@example.com' }, {});
        expect(user.id).toBe(1);
    });

    /**
     * @toReview
     */
    test.skip('model delete', async () => {

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await User.delete(1);

        expect(mockAxios.delete).toHaveBeenCalledWith('/api/luminix/users/1', {});
    });

    /**
     * @toReview
     */
    test.skip('model fetch and save', async () => {

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({
            data: {
                data: [
                    {
                        id: 1,
                        name: 'John Doe',
                        email: 'johndoe@example.com'
                    }
                ]
            }
        }));

        const user = await User.find(1);

        if (!user) {
            throw new Error('User not found');
        }

        expect(mockAxios.get).toHaveBeenCalledWith('/api/luminix/users', {
            params: {
                where: { id: 1 },
                page: 1,
                per_page: 1
            }
        });

        user.name = 'Jane Doe';

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({
            data: {
                id: 1,
                name: 'Jane Doe',
                email: 'johndoe@example.com'
            },
            status: 200 
        }));

        await user.save();

        expect(mockAxios.put).toHaveBeenCalledWith('/api/luminix/users/1', { name: 'Jane Doe' }, {});


        const PostComment = App.make('model').make('post_comment');

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({
            data: {
                data: [
                    {
                        id: 1,
                        body: 'First Comment',
                        post_id: 1,
                        user_id: 1,
                    }
                ]
            }
        }));

        const comment = await PostComment.find(1);

        if (!comment) {
            throw new Error('Comment not found');
        }

        expect(mockAxios.get).toHaveBeenCalledWith('/api/luminix/post_comments', {
            params: {
                where: { id: 1 },
                page: 1,
                per_page: 1
            }
        });

        comment.body = 'First Comment Updated';

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({
            data: {
                id: 1,
                body: 'First Comment Updated',
                post_id: 1,
                user_id: 1,
            },
            status: 200 
        }));

        await comment.save();

        expect(mockAxios.put).toHaveBeenCalledWith('/api/luminix/post_comments/1/update', { body: 'First Comment Updated' }, {});
    });

    /**
     * @toReview
     */
    test.skip('model restore and force delete', async () => {

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({ status: 200 }));

        await User.restore(1);

        expect(mockAxios.put).toHaveBeenCalledWith('/api/luminix/users/1', undefined, { params: { restore: true } });

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await User.forceDelete(1);

        expect(mockAxios.delete).toHaveBeenCalledWith('/api/luminix/users/1', { params: { force: true } });
    });

    /**
     * @toReview
     */
    test.skip('model mass delete, restore and force delete', async () => {

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await User.delete([1, 2, 3]);
        expect(mockAxios.delete).toHaveBeenCalledWith('/api/luminix/users', { params: { ids: [1, 2, 3] } });

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({ status: 200 }));
        await User.restore([1, 2, 3]);
        expect(mockAxios.put).toHaveBeenCalledWith('/api/luminix/users', { ids: [1, 2, 3] }, {});

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({ status: 204 }));
        await User.forceDelete([1, 2, 3]);
        expect(mockAxios.delete).toHaveBeenCalledWith('/api/luminix/users', { params: { ids: [1, 2, 3] } });
    });

    /**
     * @toReview
     */
    test.skip('model fillable', async () => {

        const user = new User({
            id: 1,
            name: 'John Doe',
            email: 'johndoe@example.com',
        });

        user.fill({
            foo: 'bar'
        });
        
        expect(user.diff()).toEqual({});
        
        expect(() => user.foo = 'bar').toThrow(AttributeNotFillableException);
        
        user.fill({
            name: 'Jane Doe',
            password: 'password',
            foo: 'bar',
            test: 'test'
        });

        expect(user.diff()).toEqual({ name: 'Jane Doe', password: 'password' });        

        expect(user.toJson()).toEqual({
            id: 1,
            name: 'Jane Doe',
            email: 'johndoe@example.com',
            password: 'password'
        });

        const user2 = new User({
            id: 1,
            name: 'John Doe',
            email: 'johndoe@example.com',
            email_verified_at: '2021-01-01T00:00:00.000Z', // non-fillable
        });

        user2.setAttribute('email_verified_at', '2024-01-01T00:00:00.000Z');

        expect(user2.emailVerifiedAt).toBeInstanceOf(Date);
        expect((user2.emailVerifiedAt as Date).toISOString()).toBe('2021-01-01T00:00:00.000Z');
    });

    /**
     * @toReview
     */
    test.skip('model relationships', async () => {
    
        const user = users.first()!;

        const userPost = user.posts[0];

        expect(Model.isModel(userPost)).toBe(true);
        expect(Model.isModel(userPost.comments.get(0))).toBe(true);

        const userJson: any = user.toJson();

        expect(userJson.posts.length).toBe(1);
        expect(userJson.posts[0].comments.length).toBe(1);
        expect(userJson.posts[0].attachments.length).toBe(2);

        const attachment = attachments.where('id', 1).first()!;

        expect(attachment.attachable).toBeFalsy();
        expect(attachment.author).toBeInstanceOf(User);

        const attachment2 = attachments.where('id', 2).first()!;

        expect(attachment2.attachable).toBeInstanceOf(Post);

        const attachmentJson: any = attachment2.toJson();

        expect(attachmentJson.attachable).toBeInstanceOf(Object);
        expect(attachmentJson.attachable.id).toBe(1);
    });

    /**
     * @toReview
     */
    test.skip('model casts and mutates', async () => {

        const Post = App.make('model').make('post');

        const post = new Post({
            id: 1,
            title: 'First Post',
            published_at: '2021-01-01T00:00:00.000Z',
            published: 1,
            content: null,
            likes: '100',
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: '2021-01-01T00:00:00.000Z',
        });

        expect(post.id).toBe(1);
        expect(post.title).toBe('First Post');
        expect(post.publishedAt).toBeInstanceOf(Date);
        expect((post.publishedAt as Date).toISOString()).toBe('2021-01-01T00:00:00.000Z');
        expect(post.content).toBe(null);
        expect(post.published).toBe(true);
        expect(post.likes).toBe(100);

        post.content = {
            foo: 'bar'
        };

        expect(post.content).toEqual({ foo: 'bar' });

        post.publishedAt = '2024-01-01T00:00:00.000Z';

        expect(post.publishedAt).toBeInstanceOf(Date);
        expect((post.publishedAt as Date).toISOString()).toBe('2024-01-01T00:00:00.000Z');

        post.publishedAt = new Date('2024-02-01T00:00:00.000Z');

        expect(post.publishedAt).toBeInstanceOf(Date);
        expect((post.publishedAt as Date).toISOString()).toBe('2024-02-01T00:00:00.000Z');

        post.published = '';

        expect(post.published).toBe(false);

        const Attachment = App.make('model').make('attachment');

        const attachment = new Attachment({
            id: 1,
            path: '/path/to/attachment.jpg',
            type: 'image',
        });

        attachment.size = '1000';

        expect(attachment.size).toBe(1000);
    });

    /**
     * @toReview
     */
    test.skip('model errors', async () => {

        const Attachment = App.make('model').make('attachment');
        
        expect(() => Attachment.create({})).rejects.toThrow(RouteNotFoundException);
        expect(() => Attachment.update(1, {})).rejects.toThrow(RouteNotFoundException);
        expect(() => Attachment.delete(1)).rejects.toThrow(RouteNotFoundException);
        expect(() => Attachment.find(1)).rejects.toThrow(RouteNotFoundException);
        expect(() => Attachment.restore(1)).rejects.toThrow(RouteNotFoundException);
        expect(() => Attachment.forceDelete(1)).rejects.toThrow(RouteNotFoundException);
    });

    /**
     * @toReview
     */
    test.skip('model get schema', () => {
        expect(users.first()!.schema('user')).toBeInstanceOf(User);
    });

    /**
     * @toReview
     */
    test.skip('model get relation constructors', () => {
        expect(users.first()!.getRelationConstructors('posts')).toEqual([ Post ]);
    });

    /* * * * */

    test('get model attribute', () => {

        const user = users.first();

        if (!user) {
            throw new Error('User not found');
        }

        expect(user.getAttribute('id')).toBe(1);
        expect(user.getAttribute('name')).toBe('John Doe');
    });

    test('get model primary key', () => {
        expect(users.first()!.getKey()).toBe(1);
    });
    
    test('get model primary key name', () => {
        expect(users.first()!.getKeyName()).toBe('id');
    });
    
    test('get model type', () => {        
        expect(users.first()!.getType()).toBe('user');
    });

    test('get model save route', () => {

        const user = users.first();

        if (!user) {
            throw new Error('User not found');
        }

        expect(user.getRouteForSave()).toBe('luminix.user.store');

        user.save().then(() => {
            expect(user.getRouteForSave()).toEqual([
                'luminix.user.update',
                { id: 1 },
            ]);
        });
    });

    test('get model update route', () => {
        expect(users.first()!.getRouteForUpdate()).toEqual([
            'luminix.user.update',
            { id: 1 },
        ]);
    });

    test('get model delete route', () => {
        expect(users.first()!.getRouteForDelete()).toEqual([
            'luminix.user.destroy',
            { id: 1 },
        ]);
    });

    test('get model refresh route', () => {
        expect(users.first()!.getRouteForRefresh()).toEqual([
            'luminix.user.show',
            { id: 1 },
        ]);
    });

    /**
     * @toReview
     */
    test.skip('get model label', () => {
        expect(users.first()!.getLabel()).toBe('User');
    });

    /* * * * */

    test.skip('dump model info', () => {

        const user = users.first();

        if (!user) {
            throw new Error('User not found');
        }

        expect(user.dump()).toEqual(console.log(user.toJson()));
    });

});
