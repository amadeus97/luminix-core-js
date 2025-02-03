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

const { 
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
        //
        post,
        author,
        chair,
        //
        postRelations, 
        attachmentRelations, 
        chairRelations,
    }
} = models;

describe('testing relations with eager loading', () => {

    test("model 'belongs to' relation", async () => {
        if (!postRelations) {
            throw new Error("'postRelations' is null");
        }

        expect(postRelations.author).toBeInstanceOf(BelongsTo);

        (Http.get as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
            config: {
                headers: { 'Content-Type': 'application/json' } as any,
            },
            data: { data: [] },
            headers: { 'Content-Type': 'application/json' },
            status: 200, 
            statusText: 'OK',
        })));

        const relation = post.authorRelation().get();

        expect(relation.isSingle()).toBe(true);
        expect(relation.isMultiple()).toBe(false);

        relation.dissociate();

        expect(post.relations.author).toBeNull();

        relation.associate(author);

        expect(post.relations.author).not.toBeNull();
        expect(post.relations.author).toBeInstanceOf(User);
    });

    test("model 'belongs to many' relation", async () => {
        if (!chairRelations) {
            throw new Error("'chairRelations' is null");
        }

        expect(chairRelations.users).toBeInstanceOf(BelongsToMany);

        (Http.get as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
            config: {
                headers: { 'Content-Type': 'application/json' } as any,
            },
            data: { data: [] },
            headers: { 'Content-Type': 'application/json' },
            status: 200, 
            statusText: 'OK',
        })));

        const relation = chair.usersRelation().get();

        expect(relation.isSingle()).toBe(false);
        expect(relation.isMultiple()).toBe(true);

        const chairUsers = users.filter((user) => user.chairs.some((_chair: any) => _chair.id == chair.id));

        expect(relation.all()).toEqual(chairUsers.toArray());
        expect(relation.first()).toMatchObject(chairUsers.first()!.toJson());
    });

    test("model 'has one' relation", async () => {
        if (!attachmentRelations) {
            throw new Error("'attachmentRelations' is null");
        }
        expect(attachmentRelations.file).toBeInstanceOf(HasOne);
    });

    test("model 'has many' relation", async () => {
        if (!postRelations) {
            throw new Error("'postRelations' is null");
        }
        expect(postRelations.comments).toBeInstanceOf(HasMany);
    });

    test.skip("model 'has one or many' relation", async () => {
        
    });

    /* * * * */

    test("model 'morph many' relation", async () => {
        if (!postRelations) {
            throw new Error("'postRelations' is null");
        }
        expect(postRelations.attachments).toBeInstanceOf(MorphMany);
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
