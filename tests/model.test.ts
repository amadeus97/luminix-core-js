/* eslint-disable @typescript-eslint/no-explicit-any */

import { axios as mockAxios } from '@luminix/support';

import App from '../src/facades/App';
import Model from '../src/facades/Model';

import makeConfig from './config';

import RouteNotFoundException from '../src/exceptions/RouteNotFoundException';
import AttributeNotFillableException from '../src/exceptions/AttributeNotFillableException';

App.withConfiguration(makeConfig());
App.create();

beforeEach(() => {
    jest.resetModules();
});

describe('testing models', () => {

    test('model create', async () => {

        const User = App.make('model').make('user');

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({ 
            data: { 
                id: 1, 
                name: 'John Doe', 
                email: 'johndoe@example.com' 
            }, 
            status: 200 
        }));

        const user = await User.create({
            name: 'John Doe',
            email: 'johndoe@example.com'
        });

        expect(mockAxios).toHaveBeenCalledTimes(1);
        // expect(mockAxios).toHaveBeenCalledWith('/api/luminix/users', { 
        //     name: 'John Doe', 
        //     email: 'johndoe@example.com', 
        //     password: null 
        // }, {});
        expect(mockAxios).toHaveBeenCalledWith({ 
            url: '/api/luminix/users',
            params: {
                name: 'John Doe', 
                email: 'johndoe@example.com', 
                password: null 
            }
        });

        expect(user.id).toBe(1);

        const user2 = new User();

        expect(user2.id).toBeUndefined();
    });

    test.skip('model update', async () => {

        const User = App.make('model').make('user');

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

        const User = App.make('model').make('user');

        (mockAxios as any).mockClear();
        (mockAxios as any).mockImplementationOnce(() => Promise.resolve({ status: 204 }));

        await User.delete(1);

        expect(mockAxios.delete).toHaveBeenCalledWith('/api/luminix/users/1', {});
    });

    test.skip('model fetch and save', async () => {

        const User = App.make('model').make('user');

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

        const User = App.make('model').make('user');

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

        const User = App.make('model').make('user');

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

        const User = App.make('model').make('user');

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
            attachment: Attachment, user: User, post: Post
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

});
