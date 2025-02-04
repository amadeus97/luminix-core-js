/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Response } from '@luminix/support';

import Http from '../src/facades/Http';

import BelongsTo from '../src/contracts/Relation/BelongsTo';
import BelongsToMany from '../src/contracts/Relation/BelongsToMany';
import HasMany from '../src/contracts/Relation/HasMany';
import HasOne from '../src/contracts/Relation/HasOne';
// import HasOneOrMany from '../src/contracts/Relation/HasOneOrMany';
import MorphMany from '../src/contracts/Relation/MorphMany';
// import MorphOne from '../src/contracts/Relation/MorphOne';
// import MorphOneOrMany from '../src/contracts/Relation/MorphOneOrMany';
// import MorphTo from '../src/contracts/Relation/MorphTo';
// import MorphToMany from '../src/contracts/Relation/MorphToMany';

import models from './__mocks__/appmodels';

beforeEach(() => {    
    jest.resetModules();
});

afterEach(() => {
    (Http.get as any).mockClear();
    (Http.post as any).mockClear();
    (Http.put as any).mockClear();
    (Http.patch as any).mockClear();
    (Http.delete as any).mockClear();
});

const { 
    // app: { 
    //     // App, 
    //     // baseModel, 
    // },
    models: {
        User,
        // Post,
        // Attachment,
        // Comment,
        // File,
        // Chair, 
    },
    data: {
        users,
        comments,
        attachments,
        files,
        //
        user,
        post,
        attachment,
        chair,
    }
} = models;

describe('testing relations with eager loading', () => {

    const _get = (data = { data: [], meta: {} } as any) => (Http.get as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
        config: {
            headers: { 'Content-Type': 'application/json' } as any,
        },
        data, 
        headers: { 'Content-Type': 'application/json' },
        status: 200, 
        statusText: 'OK',
    })));

    const _post = (data = {} as any) => (Http.post as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
        config: {
            headers: { 'Content-Type': 'application/json' } as any,
        },
        data, 
        headers: { 'Content-Type': 'application/json' },
        status: 200, 
        statusText: 'OK',
    })));

    const _put = (data = {} as any) => (Http.put as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
        config: {
            headers: { 'Content-Type': 'application/json' } as any,
        },
        data, 
        headers: { 'Content-Type': 'application/json' },
        status: 200, 
        statusText: 'OK',
    })));

    // const _patch = (data = {} as any) => (Http.patch as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
    //     config: {
    //         headers: { 'Content-Type': 'application/json' } as any,
    //     },
    //     data, 
    //     headers: { 'Content-Type': 'application/json' },
    //     status: 200, 
    //     statusText: 'OK',
    // })));

    // const _delete = (data = {} as any) => (Http.delete as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
    //     config: {
    //         headers: { 'Content-Type': 'application/json' } as any,
    //     },
    //     data, 
    //     headers: { 'Content-Type': 'application/json' },
    //     status: 200, 
    //     statusText: 'OK',
    // })));

    /* * * * */

    /**
     * @toReview
     */
    test.skip("model 'belongs to' relation", async () => {
        if (!post.relations) {
            throw new Error("'post authorRelations' is null");
        }

        const relation = post.authorRelation();

        expect(relation).toBeInstanceOf(BelongsTo);

        expect(relation.isSingle()).toBe(true);
        expect(relation.isMultiple()).toBe(false);

        _post();
        _put();

        const author = post.relation('author');

        relation.dissociate();
        expect(author).toBeNull();

        relation.associate(user);
        expect(author).not.toBeNull();
        expect(author).toBeInstanceOf(User);
    });

    test("model 'belongs to many' relation", async () => {
        if (!chair.relations) {
            throw new Error("'chair usersRelations' is null");
        }

        const relation = chair.usersRelation();

        expect(relation).toBeInstanceOf(BelongsToMany);

        expect(relation.isSingle()).toBe(false);
        expect(relation.isMultiple()).toBe(true);

        const chairUsers = users.filter((_user) => _user.chairs.some((_chair: any) => _chair.id == chair.id));
        const firstChairUser = chairUsers.first()!;

        /* * */

        _get({ 
            data: [ firstChairUser.toJson() ],
            meta: { 
                links: { url: '' },
                page: 1,
                per_page: 10,
                last_page: 1,
            } 
        });

        const f = await relation.first();
        expect(f.attributes).toMatchObject(firstChairUser.attributes);

        /* * */

        _get({ 
            data: chairUsers.toArray(),
            meta: { 
                links: { url: '' },
                page: 1,
                per_page: 10,
                last_page: 1,
            } 
        });

        const a = (await relation.all()).toArray();
        expect(a.map(
            (_user: any) => _user.attributes)
        ).toEqual(chairUsers.toArray().map(
            (_user: any) => _user.attributes)
        );
    });

    test("model 'has many' relation", async () => {
        if (!post.relations) {
            throw new Error("'post commentsRelations' is null");
        }

        const relation = post.commentsRelation();

        expect(relation).toBeInstanceOf(HasMany);

        expect(relation.isSingle()).toBe(false);
        expect(relation.isMultiple()).toBe(true);

        const postComments = comments.filter((_comment) => _comment.post_id == post.id);
        const firstPostComment = postComments.first()!;

        /* * */

        _get({
            data: [ firstPostComment.toJson() ],
            meta: { 
                links: { url: '' },
                page: 1,
                per_page: 10,
                last_page: 1,
            } 
        });

        const f = await relation.first();
        expect(f.attributes).toMatchObject(firstPostComment.attributes);

        /* * */

        _get({
            data: postComments.toArray(),
            meta: { 
                links: { url: '' },
                page: 1,
                per_page: 10,
                last_page: 1,
            } 
        });

        const a = (await relation.all()).toArray();
        expect(a.map(
            (_comment: any) => _comment.attributes)
        ).toEqual(postComments.toArray().map(
            (_comment: any) => _comment.attributes)
        );
    });

    test("model 'has one' relation", async () => {
        if (!attachment.relations) {
            throw new Error("'attachment fileRelations' is null");
        }

        const relation = attachment.fileRelation();

        expect(relation).toBeInstanceOf(HasOne);

        expect(relation.isSingle()).toBe(true);
        expect(relation.isMultiple()).toBe(false);

        const attachmentFiles = files.filter((_file) => _file.id == attachment.file_id);
        const firstAttachmentFile = attachmentFiles.first()!;

        /* * */

        _get({
            data: [ firstAttachmentFile.toJson() ],
            meta: { 
                links: { url: '' },
                page: 1,
                per_page: 10,
                last_page: 1,
            }
        });

        const f = (attachment.relation('file') as any).items;
        expect(f.attributes).toMatchObject(firstAttachmentFile.attributes);
    });

    test.skip("model 'has one or many' relation", async () => {
        
    });

    /* * * * */

    test("model 'morph many' relation", async () => {
        if (!post.relations) {
            throw new Error("'post attachmentsRelations' is null");
        }

        const relation = post.attachmentsRelation();

        expect(relation).toBeInstanceOf(MorphMany);

        expect(relation.isSingle()).toBe(false);
        expect(relation.isMultiple()).toBe(true);

        const postAttachments = attachments.filter(
            (_attachment) => _attachment.attachable_type == 'post' && _attachment.attachable_id == post.id
        );
        const firstPostAttachment = postAttachments.first()!;

        /* * */

        _get({
            data: [ firstPostAttachment.toJson() ],
            meta: { 
                page: 1,
                per_page: 10,
                current_page: 1,
                last_page: 1, 
            }
        });

        const items = (post.relation('attachments') as any).items;

        const f = items.first();
        expect(f.attributes).toMatchObject(firstPostAttachment.attributes);

        /* * */

        _get({
            data: postAttachments.toArray(),
            meta: { 
                page: 1,
                per_page: 10,
                current_page: 1,
                last_page: 1,
            }
        });

        const a = items.toArray();
        expect(a.map(
            (_attachment: any) => _attachment.attributes)
        ).toEqual(postAttachments.toArray().map(
            (_attachment: any) => _attachment.attributes)
        );
    });

    test.skip("model 'morph one' relation", async () => {
        
    });

    test.skip("model 'morph one or many' relation", async () => {
        
    });

    test.skip("model 'morph to' relation", async () => {
        
    });

    test.skip("model 'morph to many' relation", async () => {
        
    });

});

describe('testing relations with lazy loading', () => {

});
