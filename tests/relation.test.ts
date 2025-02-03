/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-explicit-any */

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
    // models: {
    //     // User,
    //     // Post,
    //     // Attachment,
    //     // Comment,
    //     // File,
    // },
    data: {
        // users,
        // posts,
        // attachments,
        // comments,
        // files,
        //
        // user,
        // post,
        // author,
        // attachment,
        // comment,
        //
        // userRelations, 
        postRelations, 
        // authorRelations, 
        attachmentRelations, 
        // commentRelations, 
    }
} = models;

describe('testing relations with eager loading', () => {

    test("model 'belongs to' relation", async () => {
        if (!postRelations) {
            throw new Error("'postRelations' is null");
        }
        expect(postRelations.author).toBeInstanceOf(BelongsTo);
    });

    test("model 'belongs to many' relation", async () => {
        if (!attachmentRelations) {
            throw new Error("'attachmentRelations' is null");
        }
        expect(attachmentRelations.posts).toBeInstanceOf(BelongsToMany);
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
