/* eslint-disable @typescript-eslint/no-explicit-any */

import { Collection } from '@luminix/support';

import App from '../src/facades/App';
import Model from '../src/facades/Model';

import mockAxios from 'axios';
// import mockAxios from './__mocks__/axios';
import makeConfig from './config';

import RouteNotFoundException from '../src/exceptions/RouteNotFoundException';
import AttributeNotFillableException from '../src/exceptions/AttributeNotFillableException';

App.withConfiguration(makeConfig());
App.create();

beforeEach(() => {
    jest.resetModules();
});

function collect<T = unknown>(items: T[]) {
    return new Collection(items);
}

describe('testing models', () => {

    const baseModel = App.make('model');

    // const Role = baseModel.make('role');
    const User = baseModel.make('user');
    const Post = baseModel.make('post');
    // const Comment = baseModel.make('comment');

    test('model create', async () => {

        const options = { 
            resolve: { 
                id: 1, 
                name: 'John Doe', 
                email: 'johndoe@example.com' 
            }, 
            status: 200 
        };

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve(options));

        // mockAxios.post(options);

        const user = await User.create({
            name: 'John Doe',
            email: 'johndoe@example.com'
        });

        expect(mockAxios.post).toHaveBeenCalledTimes(1);
        expect(mockAxios.post).toHaveBeenCalledWith('/api/luminix/users', { 
            name: 'John Doe', 
            email: 'johndoe@example.com', 
            password: null 
        }, {});
        // expect(mockAxios.post).toHaveBeenCalledWith({ 
        //     url: '/api/luminix/users',
        //     params: {
        //         name: 'John Doe', 
        //         email: 'johndoe@example.com', 
        //         password: null 
        //     }
        // });

        expect(user.id).toBe(1);

        const user2 = new User();

        expect(user2.id).toBeUndefined();
    });

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

    test.skip('model delete', async () => {

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await User.delete(1);

        expect(mockAxios.delete).toHaveBeenCalledWith('/api/luminix/users/1', {});
    });

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

        const {
            user: User, 
            post: Post,
            attachment: Attachment, 
        } = App.make('model').make();
    
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
                    ],
                    attachments: [
                        {
                            id: 1,
                            path: '/path/to/attachment.jpg',
                            type: 'image',
                            author_id: 1,
                        },
                        {
                            id: 2,
                            path: '/path/to/attachment2.jpg',
                            type: 'image',
                            author_id: 1,
                        }
                    ]
                }
            ],
            
        });

        expect(Model.isModel(user.posts.get(0))).toBe(true);
        expect(Model.isModel(user.posts.get(0).comments.get(0))).toBe(true);

        const userJson: any = user.toJson();

        expect(userJson.posts.length).toBe(1);
        expect(userJson.posts[0].comments.length).toBe(1);
        expect(userJson.posts[0].attachments.length).toBe(2);

        const attachment = new Attachment({
            id: 1,
            path: '/path/to/attachment.jpg',
            type: 'image',
            author: {
                id: 1,
                name: 'John Doe'
            },
            attachable: null,
            attachable_type: null,
            attachable_id: null,
        });

        expect(attachment.attachable).toBeFalsy();
        expect(attachment.author).toBeInstanceOf(User);

        const attachment2 = new Attachment({
            id: 2,
            path: '/path/to/attachment2.jpg',
            type: 'image',
            author: {
                id: 1,
                name: 'John Doe'
            },
            attachable_type: 'post',
            attachable_id: 1,
            attachable: {
                id: 1,
                title: 'First Post'
            }
        });

        expect(attachment2.attachable).toBeInstanceOf(Post);

        const attachmentJson: any = attachment2.toJson();

        expect(attachmentJson.attachable).toBeInstanceOf(Object);
        expect(attachmentJson.attachable.id).toBe(1);
    });

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

    test.skip('model errors', async () => {

        const Attachment = App.make('model').make('attachment');
        
        expect(() => Attachment.create({})).rejects.toThrow(RouteNotFoundException);
        expect(() => Attachment.update(1, {})).rejects.toThrow(RouteNotFoundException);
        expect(() => Attachment.delete(1)).rejects.toThrow(RouteNotFoundException);
        expect(() => Attachment.find(1)).rejects.toThrow(RouteNotFoundException);
        expect(() => Attachment.restore(1)).rejects.toThrow(RouteNotFoundException);
        expect(() => Attachment.forceDelete(1)).rejects.toThrow(RouteNotFoundException);
    });

    /* * * * */

    // const roles = collect([
    //     new Role({ id: 1, name: 'Admin' }),
    //     new Role({ id: 2, name: 'User' }),
    // ]);

    const user = new User({ id: 1, name: 'John Doe' });

    const posts = collect([
        new Post({ id: 1, title: 'First Post', user_id: 1 }),
        new Post({ id: 2, title: 'Second Post', user_id: 1 }),
    ]);

    // const comments = collect([
    //     new Comment({ id: 1, body: 'First Comment', post_id: 1 }),
    //     new Comment({ id: 2, body: 'Second Comment', post_id: 1 }),
    //     new Comment({ id: 3, body: 'Third Comment', post_id: 2 }),
    // ]);

    test('get model attribute', () => {
        expect(user.getAttribute('id')).toBe(1);
        expect(user.getAttribute('name')).toBe('John Doe');
    });

    test('get model primary key', () => {
        expect(user.getKey()).toBe(1);
    });
    
    test('get model primary key name', () => {
        expect(user.getKeyName()).toBe('id');
    });
    
    test('get model type', () => {        
        expect(user.getType()).toBe('user');
    });
    
    test('get model relation', () => {        
        expect(user.getRelation('posts').first()).toBeInstanceOf(Post);
        expect(user.getRelation('posts').get().pluck('title')).toEqual([ 'First Post', 'Second Post' ]);

        expect(posts.first()!.getRelation('user')).toBeInstanceOf(User);
        expect(posts.first()!.getRelation('user').getAttribute('name')).toBe('John Doe');
    });

    test('get model save route', () => {
        expect(user.getRouteForSave()).toBe('luminix.user.store');

        user.save();

        expect(user.getRouteForSave()).toEqual([
            'luminix.user.update',
            { id: 1 },
        ]);
    });

    test('get model update route', () => {
        expect(user.getRouteForUpdate()).toEqual([
            'luminix.user.update',
            { id: 1 },
        ]);
    });

    test('get model delete route', () => {
        expect(user.getRouteForDelete()).toEqual([
            'luminix.user.destroy',
            { id: 1 },
        ]);
    });

    test('get model refresh route', () => {
        expect(user.getRouteForRefresh()).toEqual([
            'luminix.user.show',
            { id: 1 },
        ]);
    });

    test('get model label', () => {
        expect(user.getLabel()).toBe('User');
    });

    /* * * * */

    test.skip('dump model info', () => {
        expect(user.dump()).toEqual(console.log(user.toJson()));
    });

});
