/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Collection } from '@luminix/support';

import App from '../src/facades/App';

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

import makeConfig from './config';

App.withConfiguration(makeConfig());
App.create();

beforeEach(() => {
    jest.resetModules();
});

function collect<T = unknown>(items: T[]) {
    return new Collection(items);
}

describe('testing relations', () => {

    const baseModel = App.make('model');

    const User = baseModel.make('user');
    const Post = baseModel.make('post');
    const Attachment = baseModel.make('attachment');
    const Comment = baseModel.make('post_comment');

    const files = collect([
        {
            id: 1,
            path: '/path/to/file.jpg',
            type: 'image',
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: null,
        }
    ]);

    const attachments = collect([
        { 
            id: 1, 
            path: '/path/to/attachment.jpg', 
            type: 'image', 
            author_id: 1, 
            author: {
                id: 1,
                name: 'John Doe'
            },
            file_id: 1,
            file: null,
            attachable: null,
            attachable_type: null,
            attachable_id: null,
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: '2021-01-01T00:00:00.000Z',
        }
    ]);

    const comments = collect([
        {
            id: 1,
            post_id: 1,
            content: 'foo bar',
            user_id: 1,
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: null,
        },
        {
            id: 2,
            post_id: 1,
            content: 'lorem ipsum',
            user_id: 1,
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: '2021-01-01T00:00:00.000Z',
        },
    ]);

    const posts = collect([
        {
            id: 1,
            title: 'First Post',
            published: 1,
            content: 'foo bar',
            likes: '100',
            user_id: 1,
            attachments: null,
            comments: null,
        },
        {
            id: 2,
            title: 'Second Post',
            published: 1,
            content: 'lorem ipsum',
            likes: '10',
            user_id: 1,
            attachments: null,
            comments: null,
        },
    ]);

    const user = new User({
        id: 1,
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: null,
        posts: posts.where('user_id', 1).toArray().map((post) => {

            const p = new Post(post);

            const _attachments = attachments.where('id', 1).toArray().map((attachment) => {

                const a = new Attachment(attachment);

                a.setAttribute('file', files.first());

                return a;
            });

            const _comments = comments.where('id', 1).toArray().map((comment) => new Comment(comment));

            p.setAttribute(
                'attachments', 
                _attachments.length > 1 ? _attachments : _attachments[0]
            );
            p.setAttribute(
                'comments', 
                _comments.length > 1 ? _comments : _comments[0]
            );

            return p;
        }),
    });

    /* * * * */

    // console.log({ 
    //     user,
    //     user_relations: user.relations,
    //     posts: user.posts.items, 
    //     post_relations: user.posts.items[0].relations,
    //     attachments: user.posts.items[0].attachments,
    //     // attachment_relations: user.posts.items[0].attachments.items[0].relations,
    //     comments: user.posts.items[0].comments,
    //     // comment_relations: user.posts.items[0].comments.items[0].relations
    // });

    const post = user.posts ? user.posts.items[0] : null;
    // const author = post.author ? post.author : null;
    const attachment = post.attachments ? post.attachments.items[0] : null;
    // const comment = post.comments ? post.comments.items[0] : null;

    /* * * * */

    // const userRelations = user && user.relations ? user.relations : null;
    const postRelations = post && post.relations ? post.relations : null;
    // const authorRelations = author && author.relations ? author.relations : null;
    const attachmentRelations = attachment && attachment.relations ? attachment.relations : null;
    // const commentRelations = comment && comment.relations ? comment.relations : null;

    /* * * * */

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
