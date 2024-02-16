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

        expect(mockAxios.post).toHaveBeenCalledWith('/api/luminix/users', { name: 'John Doe', email: 'johndoe@example.com' }, {});
        expect(user.id).toBe(1);

        const user2 = new User();

        expect(user2.id).toBeUndefined();

    });

    test('model update', async () => {
        const app: AppFacade = new App();

        await app.boot({ config: makeConfig() });

        const User = app.make('repository').make('user');

        (mockAxios as any).put.mockImplementationOnce(() => Promise.resolve({ data: { id: 1, name: 'John Doe', email: 'johndoe@example.com' }, status: 200 }));

        const user = await User.update(1, {
            name: 'John Doe',
            email: 'johndoe@example.com'
        });

        expect(mockAxios.put).toHaveBeenCalledWith('/api/luminix/users/1', { name: 'John Doe', email: 'johndoe@example.com' }, {});
        expect(user.id).toBe(1);

    });

    test('model delete', async () => {
        const app: AppFacade = new App();

        await app.boot({ config: makeConfig() });

        const User = app.make('repository').make('user');

        (mockAxios as any).delete.mockImplementationOnce(() => Promise.resolve({ status: 200 }));

        await User.delete(1);

        expect(mockAxios.delete).toHaveBeenCalledWith('/api/luminix/users/1', {});

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

        expect(mockAxios.get).toHaveBeenCalledWith('/api/luminix/users/1', {});

        user.name = 'Jane Doe';

        (mockAxios as any).put.mockImplementationOnce(() => Promise.resolve({
            data: {
                id: 1,
                name: 'Jane Doe',
                email: 'johndoe@example.com'
            },
            status: 200 
        }));

        await user.save();

        expect(mockAxios.put).toHaveBeenCalledWith('/api/luminix/users/1', { name: 'Jane Doe' }, {});


        const PostComment = app.make('repository').make('post_comment');

        (mockAxios as any).get.mockImplementationOnce(() => Promise.resolve({
            data: {
                id: 1,
                body: 'First Comment',
                post_id: 1,
                user_id: 1,
            }
        }));

        const comment = await PostComment.find(1);

        expect(mockAxios.get).toHaveBeenCalledWith('/api/luminix/post_comments/1', {});

        comment.body = 'First Comment Updated';

        (mockAxios as any).put.mockImplementationOnce(() => Promise.resolve({
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

    test('model restore and force delete', async () => {
        const app: AppFacade = new App();

        await app.boot({ config: makeConfig() });

        const User = app.make('repository').make('user');

        (mockAxios as any).put.mockImplementationOnce(() => Promise.resolve({ status: 200 }));

        await User.restore(1);

        expect(mockAxios.put).toHaveBeenCalledWith('/api/luminix/users/1', undefined, { params: { restore: true } });

        (mockAxios as any).delete.mockImplementationOnce(() => Promise.resolve({ status: 200 }));

        await User.forceDelete(1);

        expect(mockAxios.delete).toHaveBeenCalledWith('/api/luminix/users/1', { params: { force: true } });

    });

    test('model mass delete, restore and force delete', async () => {
        const app: AppFacade = new App();

        await app.boot({ config: makeConfig() });

        const User = app.make('repository').make('user');

        (mockAxios as any).delete.mockImplementationOnce(() => Promise.resolve({ status: 200 }));
        await User.massDelete([1, 2, 3]);
        expect(mockAxios.delete).toHaveBeenCalledWith('/api/luminix/users', { params: { ids: [1, 2, 3] } });

        (mockAxios as any).put.mockImplementationOnce(() => Promise.resolve({ status: 200 }));
        await User.massRestore([1, 2, 3]);
        expect(mockAxios.put).toHaveBeenCalledWith('/api/luminix/users', { ids: [1, 2, 3] }, {});

        (mockAxios as any).delete.mockImplementationOnce(() => Promise.resolve({ status: 200 }));
        await User.massForceDelete([1, 2, 3]);
        expect(mockAxios.delete).toHaveBeenCalledWith('/api/luminix/users', { params: { ids: [1, 2, 3] } });

    });

    test('model fillable', async () => {
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
            password: 'password'
        });

        const user2 = new User({
            id: 1,
            name: 'John Doe',
            email: 'johndoe@example.com',
            email_verified_at: '2021-01-01T00:00:00.000Z', // non-fillable
        });

        user2.setAttribute('email_verified_at', '2024-01-01T00:00:00.000Z');

        expect(user2.email_verified_at).toBeInstanceOf(Date);
        expect(user2.email_verified_at.toISOString()).toBe('2021-01-01T00:00:00.000Z');

    });

    test('model relationships', async () => {
        const app: AppFacade = new App();

        await app.boot({ config: makeConfig() });

        const {
            attachment: Attachment, user: User, post: Post, post_comment: Comment
        } = app.make('repository').make();
    
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

        expect(user.posts[0]).toBeInstanceOf(Post);
        expect(user.posts[0].comments[0]).toBeInstanceOf(Comment);

        const userJson: any = user.json();

        expect(userJson.posts).toHaveLength(1);
        expect(userJson.posts[0].comments).toHaveLength(1);
        expect(userJson.posts[0].attachments).toHaveLength(2);



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

        const attachmentJson: any = attachment2.json();

        expect(attachmentJson.attachable).toBeInstanceOf(Object);
        expect(attachmentJson.attachable.id).toBe(1);
    });

    test('model casts and mutates', async () => {
        const app: AppFacade = new App();

        await app.boot({ config: makeConfig() });

        const Post = app.make('repository').make('post');

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
        expect(post.published_at).toBeInstanceOf(Date);
        expect(post.published_at.toISOString()).toBe('2021-01-01T00:00:00.000Z');
        expect(post.content).toBe(null);
        expect(post.published).toBe(true);
        expect(post.likes).toBe(100);

        post.content = {
            foo: 'bar'
        };

        expect(post.content).toEqual({ foo: 'bar' });

        post.published_at = '2024-01-01T00:00:00.000Z';

        expect(post.published_at).toBeInstanceOf(Date);
        expect(post.published_at.toISOString()).toBe('2024-01-01T00:00:00.000Z');

        post.published_at = new Date('2024-02-01T00:00:00.000Z');

        expect(post.published_at).toBeInstanceOf(Date);
        expect(post.published_at.toISOString()).toBe('2024-02-01T00:00:00.000Z');

        post.published = '';

        expect(post.published).toBe(false);

        const Attachment = app.make('repository').make('attachment');

        const attachment = new Attachment({
            id: 1,
            path: '/path/to/attachment.jpg',
            type: 'image',
        });

        attachment.size = '1000';

        expect(attachment.size).toBe(1000);

    });

    test('model errors', async () => {
        const app: AppFacade = new App();

        await app.boot({
            config: makeConfig(),
        });

        const Attachment = app.make('repository').make('attachment');

        expect(() => Attachment.create({})).rejects.toThrow("Route data for 'luminix.attachment.store' was not found.");
        expect(() => Attachment.update(1, {})).rejects.toThrow("Route data for 'luminix.attachment.update' was not found.");
        expect(() => Attachment.delete(1)).rejects.toThrow("Route data for 'luminix.attachment.destroy' was not found.");
        expect(() => Attachment.find(1)).rejects.toThrow("Route data for 'luminix.attachment.show' was not found.");
        expect(() => Attachment.restore(1)).rejects.toThrow("Route data for 'luminix.attachment.update' was not found.");
        expect(() => Attachment.forceDelete(1)).rejects.toThrow("Route data for 'luminix.attachment.destroy' was not found.");

    });

});
