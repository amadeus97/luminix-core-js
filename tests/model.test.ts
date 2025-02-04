/* eslint-disable @typescript-eslint/no-explicit-any */

import { Response } from '@luminix/support';

import Http from '../src/facades/Http';

import RouteNotFoundException from '../src/exceptions/RouteNotFoundException';
import AttributeNotFillableException from '../src/exceptions/AttributeNotFillableException';

import models from './__mocks__/appmodels';

import BelongsTo from '../src/contracts/Relation/BelongsTo';
import BelongsToMany from '../src/contracts/Relation/BelongsToMany';
import HasMany from '../src/contracts/Relation/HasMany';
import HasOne from '../src/contracts/Relation/HasOne';
import MorphMany from '../src/contracts/Relation/MorphMany';
import MorphOne from '../src/contracts/Relation/MorphOne';
import MorphTo from '../src/contracts/Relation/MorphTo';
import MorphToMany from '../src/contracts/Relation/MorphToMany';

beforeEach(() => {
    jest.resetModules();
});

const { 
    app: { 
        baseModel, 
    },
    models: {
        User,
        Attachment,
        Comment,
    },
    data: {
        users,
        //
        user,
        post,
        attachment,
    }
} = models;

describe('testing models', () => {

    test('model create', async () => {
        
        (Http.post as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
            config: {
                headers: { 'Content-Type': 'application/json' } as any,
            },
            data: {
                id: 1,
                name: 'John Doe',
                email: 'johndoe@example.com',
                password: null,
            }, 
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

    test('model update', async () => {

        (Http.put as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
            config: {
                headers: { 'Content-Type': 'application/json' } as any,
            },
            data: {
                id: 1,
                name: 'John Doe',
                email: 'johndoe@example.com',
            }, 
            headers: { 'Content-Type': 'application/json' },
            status: 200, 
            statusText: 'OK',
        })));

        const user = await User.update(1, {
            name: 'John Doe',
            email: 'johndoe@example.com'
        });

        expect(Http.put).toHaveBeenCalledWith('/api/luminix/users/1');
        expect(Http.withData).toHaveBeenCalledWith({ 
            name: 'John Doe', 
            email: 'johndoe@example.com', 
        });

        expect(user.id).toBe(1);
    });

    /**
     * @toReview
     */
    test.skip('model delete', async () => {

        (Http.delete as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
            config: {
                headers: { 'Content-Type': 'application/json' } as any,
            },
            data: {
                name: 'John Doe',
                email: 'johndoe@example.com',
            }, 
            headers: { 'Content-Type': 'application/json' },
            status: 204, 
            statusText: 'OK',
        })));

        await User.delete(1);

        expect(Http.delete).toHaveBeenCalledWith('/api/luminix/users/1');
        expect(Http.withData).toHaveBeenCalledWith({ 
            name: 'John Doe',
            email: 'johndoe@example.com',
        });

        expect(User.find(1)).toBeNull();
    });

    test('model fetch and save', async () => {

        (Http.get as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
            config: {
                headers: { 'Content-Type': 'application/json' } as any,
            },
            data: {
                data: [
                    {
                        id: 1,
                        name: 'John Doe',
                        email: 'johndoe@example.com'
                    }
                ]
            },
            headers: { 'Content-Type': 'application/json' },
            status: 200, 
            statusText: 'OK',
        })));

        const user = await User.find(1);

        if (!user) {
            throw new Error('User not found');
        }

        expect(Http.get).toHaveBeenCalledWith('/api/luminix/users');
        // expect(Http.get).toHaveBeenCalledWith('/api/luminix/users?where[id]=1&per_page=1&page=1');
        expect(Http.withData).toHaveBeenCalledWith({
            name: 'John Doe',
            email: 'johndoe@example.com',
            password: null,
        });

        user.name = 'Jane Doe';

        (Http.put as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
            config: {
                headers: { 'Content-Type': 'application/json' } as any,
            },
            data: { 
                id: 1, 
                name: 'Jane Doe',
                email: 'johndoe@example.com',
            }, 
            headers: { 'Content-Type': 'application/json' },
            status: 200, 
            statusText: 'OK',
        })));

        await user.save();

        expect(Http.put).toHaveBeenCalledWith('/api/luminix/users/1');
        expect(Http.withData).toHaveBeenCalledWith({ name: 'Jane Doe' });

        /* * */

        (Http.get as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
            config: {
                headers: { 'Content-Type': 'application/json' } as any,
            },
            data: {
                data: [
                    {
                        id: 1,
                        body: 'First Comment',
                        post_id: 1,
                        user_id: 1,
                    }
                ]
            },
            headers: { 'Content-Type': 'application/json' },
            status: 200, 
            statusText: 'OK',
        })));

        const comment = await Comment.find(1);

        if (!comment) {
            throw new Error('Comment not found');
        }

        expect(Http.get).toHaveBeenCalledWith('/api/luminix/post_comments');
        expect(Http.withData).toHaveBeenCalledWith({
            name: 'John Doe',
            email: 'johndoe@example.com',
            password: null,
        });

        comment.body = 'First Comment Updated';

        (Http.put as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
            config: {
                headers: { 'Content-Type': 'application/json' } as any,
            },
            data: {
                id: 1,
                body: 'First Comment Updated',
                post_id: 1,
                user_id: 1,
            },
            headers: { 'Content-Type': 'application/json' },
            status: 200, 
            statusText: 'OK',
        })));

        await comment.save();

        expect(Http.put).toHaveBeenCalledWith('/api/luminix/post_comments/1/update');
        expect(Http.withData).toHaveBeenCalledWith({ body: 'First Comment Updated' });
    });

    test('model restore and force delete', async () => {

        (Http.put as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
            config: {
                headers: { 'Content-Type': 'application/json' } as any,
            },
            data: {
                name: 'John Doe',
                email: 'johndoe@example.com',
                password: null,
            },
            headers: { 'Content-Type': 'application/json' },
            status: 200, 
            statusText: 'OK',
        })));

        await User.restore(1);

        expect(Http.put).toHaveBeenCalledWith('/api/luminix/users/1');
        expect(Http.withData).toHaveBeenCalledWith({
            name: 'John Doe',
            email: 'johndoe@example.com',
            password: null,
        });

        /* * */

        (Http.delete as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
            config: {
                headers: { 'Content-Type': 'application/json' } as any,
            },
            data: {
                name: 'John Doe',
                email: 'johndoe@example.com',
            },
            headers: { 'Content-Type': 'application/json' },
            status: 204, 
            statusText: 'OK',
        })));

        await User.forceDelete(1);

        expect(Http.delete).toHaveBeenCalledWith('/api/luminix/users/1');
        expect(Http.withData).toHaveBeenCalledWith({
            name: 'John Doe',
            email: 'johndoe@example.com',
        });
    });

    test('model mass delete, restore and force delete', async () => {

        (Http.delete as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
            config: {
                headers: { 'Content-Type': 'application/json' } as any,
            },
            data: {
                name: 'John Doe',
                email: 'johndoe@example.com',
                password: null,
            },
            headers: { 'Content-Type': 'application/json' },
            status: 200, 
            statusText: 'OK',
        })));

        await User.delete([1, 2, 3]);
        expect(Http.delete).toHaveBeenCalledWith('/api/luminix/users');
        expect(Http.withData).toHaveBeenCalledWith({
            name: 'John Doe',
            email: 'johndoe@example.com',
            password: null,
        });

        /* * */

        (Http.put as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
            config: {
                headers: { 'Content-Type': 'application/json' } as any,
            },
            data: {
                name: 'John Doe',
                email: 'johndoe@example.com',
                password: null,
            },
            headers: { 'Content-Type': 'application/json' },
            status: 200, 
            statusText: 'OK',
        })));

        await User.restore([ 1, 2, 3 ]);
        expect(Http.put).toHaveBeenCalledWith('/api/luminix/users');
        expect(Http.withData).toHaveBeenCalledWith({ ids: [ 1, 2, 3 ]});

        /* * */

        (Http.delete as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
            config: {
                headers: { 'Content-Type': 'application/json' } as any,
            },
            data: {
                name: 'John Doe',
                email: 'johndoe@example.com',
                password: null,
            },
            headers: { 'Content-Type': 'application/json' },
            status: 200, 
            statusText: 'OK',
        })));

        await User.forceDelete([1, 2, 3]);
        expect(Http.delete).toHaveBeenCalledWith('/api/luminix/users');
        expect(Http.withData).toHaveBeenCalledWith({
            name: 'John Doe',
            email: 'johndoe@example.com',
            password: null,
        });
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

        user.fill({ foo: 'bar' });
        
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

        /* * */

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

        const posts = user.posts.items;

        const comments = posts[0].comments.items;
        const attachments = posts[0].attachments.items;

        expect(posts.length).toBe(2);
        expect(comments.length).toBe(2);
        expect(attachments.length).toBe(1);

        expect(attachment.attachable_id).toBe(1);
        expect(attachment.attachable_type).toBe('post');

        // expect(attachment.attachable).toBeTruthy();
        // expect(attachment.attachable).toBeInstanceOf(Post);
        // expect(attachment.attachable.id).toBe(1);

        expect(attachment.author).toBeInstanceOf(User);
    });

    /**
     * @toReview
     */
    test.skip('model casts and mutates', async () => {

        expect(post.id).toBe(1);
        expect(post.title).toBe('My Post');
        // expect(post.publishedAt).toBeInstanceOf(Date);
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

        /* * */

        attachment.size = '1000';

        expect(attachment.size).toBe(1000);
    });

    test('model errors', async () => {
        expect(async () => await Attachment.create({})).rejects.toThrow(RouteNotFoundException);
        expect(async () => await Attachment.update(1, { path: '/path/to/update_attachment.jpg' })).rejects.toThrow(RouteNotFoundException);
        expect(async () => await Attachment.delete(1)).rejects.toThrow(RouteNotFoundException);
        expect(async () => await Attachment.find(1)).rejects.toThrow(RouteNotFoundException);
        expect(async () => await Attachment.restore(1)).rejects.toThrow(RouteNotFoundException);
        expect(async () => await Attachment.forceDelete(1)).rejects.toThrow(RouteNotFoundException);
    });

    test('model get relation constructors', () => {
        expect(baseModel.getRelationConstructors('user')).toMatchObject({
            'BelongsTo': BelongsTo, 
            'BelongsToMany': BelongsToMany, 
            'HasMany': HasMany, 
            'HasOne': HasOne, 
            'MorphMany': MorphMany, 
            'MorphOne': MorphOne, 
            'MorphTo': MorphTo, 
            'MorphToMany': MorphToMany,
        });
    });

    /* * * * */

    test('model get schema', () => {
        expect(User.getSchema()).toMatchObject({
            casts: {
                id: 'int',
                email_verified_at: 'datetime',
                password: 'hashed',
            },
            class: 'App\\Models\\User',
            exportable: false,
            fillable: [
                'name',
                'email',
                'password',
            ],
            importable: false,
            primaryKey: 'id',
            relations: {
                attachments: {
                    model: 'attachment',
                    type: 'MorphMany',
                },
                comments: {
                    model: 'post_comment',
                    type: 'HasMany',
                },
                posts: {
                    model: 'post',
                    type: 'HasMany',
                },
            },
            softDeletes: false,
            timestamps: true,
        });
    });

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

    /**
     * @toReview
     */
    test.skip('get model save route', () => {

        const user = users.first();

        if (!user) {
            throw new Error('User not found');
        }

        if (!User.find(1)) {
            expect(user.getRouteForSave()).toBe('luminix.user.update');
        }

        expect(user.getRouteForSave()).toBe('luminix.user.store');

        // user.save().then(() => {
        //     expect(user.getRouteForSave()).toEqual([
        //         'luminix.user.update',
        //         { id: 1 },
        //     ]);
        // });
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
