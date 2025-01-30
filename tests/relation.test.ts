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

    const File = baseModel.make('file');
    const Attachment = baseModel.make('attachment');
    const Comment = baseModel.make('post_comment');

    const files = collect([
        new File({
            id: 1,
            path: '/path/to/file.jpg',
            type: 'image',
            attachment_id: 1,
            attachment: null,
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: null,
        })
    ]);

    const attachments = collect([
        new Attachment({ 
            id: 1, 
            path: '/path/to/attachment.jpg', 
            type: 'image', 
            author_id: 1, 
            author: null,
            file_id: 1,
            file: null,
            attachable: null,
            attachable_type: 'post',
            attachable_id: 1,
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: '2021-01-01T00:00:00.000Z',
        })
    ]);

    const comments = collect([
        new Comment({
            id: 1,
            post_id: 1,
            post: null,
            content: 'foo bar',
            user_id: 1,
            user: null,
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: null,
        }),
        new Comment({
            id: 2,
            post_id: 1,
            post: null,
            content: 'lorem ipsum',
            user_id: 1,
            user: null,
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: '2021-01-01T00:00:00.000Z',
        }),
    ]);

    const posts = collect([
        new Post({
            id: 1,
            title: 'First Post',
            published: 1,
            content: 'foo bar',
            likes: '100',
            author_id: 1,
            author: null,
            // if many items, set as array of objects
            // otherwise set as single object
            comments: [],
            attachments: [],
        }),
        new Post({
            id: 2,
            title: 'Second Post',
            published: 1,
            content: 'lorem ipsum',
            likes: '10',
            author_id: 1,
            author: null,
            comments: [],
            attachments: [],
        }),
    ]);

    const users = collect([
        new User({
            id: 1,
            name: 'John Doe',
            email: 'johndoe@example.com',
            password: null,
            posts: [],
            comments: [],
        })
    ]);

    /* * * * */

    files.each((file) => {
        file.setAttribute(
            'attachment', 
            attachments.where('id', file.attachment_id).first()?.toJson()
        );

        file.save();
    });

    attachments.each((attachment) => {
        attachment.setAttribute(
            'author', 
            users.where('id', attachment.author_id).first()?.toJson()
        );
        attachment.setAttribute(
            'file', 
            files.where('id', attachment.file_id).first()?.toJson()
        );
        attachment.setAttribute(
            'attachable', 
            posts.where('id', attachment.attachable_id).first()?.toJson()
        );

        attachment.save();
    });

    comments.each((comment) => {
        comment.setAttribute(
            'user', 
            users.where('id', comment.user_id).first()?.toJson()
        );
        comment.setAttribute(
            'post', 
            posts.where('id', comment.post_id).first()?.toJson()
        );

        comment.save();
    });

    posts.each((post) => {
        post.setAttribute(
            'author', 
            users.where('id', post.author_id).first()?.toJson()
        );
        post.setAttribute(
            'comments', 
            comments.where('post_id', post.id).toArray()
        );
        post.setAttribute(
            'attachments', 
            attachments.where('attachable_id', post.id).toArray()
        );

        post.save();
    });

    users.each((user) => {
        user.setAttribute(
            'posts', 
            posts.where('author_id', user.id).toArray()
        );
        user.setAttribute(
            'comments', 
            comments.where('user_id', user.id).toArray()
        );

        user.save();
    });

    /* * * * */

    const user = users.first()!;

    console.log({ user, posts: user.posts.items, comments: user.comments.items });

    const post = user && user.posts.items && user.posts.length ? user.posts.items[0] : null;
    // const comment = user && user.comments.items && user.comments.length ? user.comments.items[0] : null;

    // const author = post && post.author ? post.author : null;
    const attachment = post && post.attachments ? post.attachments.items[0] : null;

    /* * * * */

    // const userRelations = user && user.relations ? user.relations : null;
    const postRelations = post && post.relations ? post.relations : null;
    // const authorRelations = author && author.relations ? author.relations : null;
    const attachmentRelations = attachment && attachment.relations ? attachment.relations : null;
    // const commentRelations = comment && comment.relations ? comment.relations : null;

    // console.log({ user, post, author, attachment, comment });

    // console.log({
    //     user_relations: userRelations,
    //     post_relations: postRelations,
    //     author_relations: authorRelations,
    //     attachment_relations: attachmentRelations,
    //     comment_relations: commentRelations,
    // });

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
