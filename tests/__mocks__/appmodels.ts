/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Collection } from '@luminix/support';

import App from '../../src/facades/App';
import { Model } from '../../src/types/Model';

import { HttpServiceProvider } from './httpservice';

import makeConfig from '../config';

/* * * * */

function collect<T = unknown>(items: T[]) {
    return new Collection(items);
}

App.withProviders([ HttpServiceProvider ])
    .withConfiguration(makeConfig())
    .create();

const baseModel = App.make('model');

const User = baseModel.make('user');
const Post = baseModel.make('post');

const File = baseModel.make('file');
const Attachment = baseModel.make('attachment');
const Comment = baseModel.make('post_comment');

const Chair = baseModel.make('chair');

/* * */

const files = collect([
    new File({
        path: '/path/to/file.jpg',
        type: 'image',
        attachment_id: 1,
        attachment: {
            id: 1,
            path: '/path/to/attachment.jpg',
            type: 'image',
        },
        created_at: '2021-01-01T00:00:00.000Z',
        updated_at: '2021-01-01T00:00:00.000Z',
        deleted_at: null,
    })
]) as Collection<Model>;

const attachments = collect([
    new Attachment({
        path: '/path/to/attachment.jpg',
        type: 'image',
        author_id: 1,
        author: {
            id: 1,
            name: 'John Doe',
        },
        file_id: 1,
        file: {
            id: 1,
            type: 'image',
        },
        attachable: null,
        // attachable: {
        //     id: 1,
        //     title: 'My Post',
        //     content: 'This is my post',
        //     author_id: 1,
        //     author: {
        //         id: 1,
        //         name: 'John Doe',
        //     },
        //     comments: [],
        //     attachments: [],
        // },
        attachable_type: 'post',
        attachable_id: 1,
        created_at: '2021-01-01T00:00:00.000Z',
        updated_at: '2021-01-01T00:00:00.000Z',
        deleted_at: null,
    })
]) as Collection<Model>;

const comments = collect([
    new Comment({
        id: 1,
        content: 'This is a comment',
        author_id: 1,
        author: {
            id: 1,
            name: 'John Doe',
        },
        post_id: 1,
        post: {
            id: 1,
            title: 'My Post',
        },
        created_at: '2021-01-01T00:00:00.000Z',
        updated_at: '2021-01-01T00:00:00.000Z',
        deleted_at: null,
    }),
    new Comment({
        id: 2,
        content: 'This is another comment',
        author_id: 1,
        author: {
            id: 1,
            name: 'John Doe',
        },
        post_id: 1,
        post: {
            id: 1,
            title: 'My Post',
        },
        created_at: '2021-01-01T00:00:00.000Z',
        updated_at: '2021-01-01T00:00:00.000Z',
        deleted_at: '2021-01-01T00:00:00.000Z',
    }),
]) as Collection<Model>;

const posts = collect([
    new Post({
        id: 1,
        title: 'My Post',
        content: 'This is my post',
        published_at: '2021-01-01T00:00:00.000Z',
        author_id: 1,
        author: {
            id: 1,
            name: 'John Doe',
        },
        comments: comments.where('post_id', 1).toArray(),
        attachments: attachments.where('attachable_id', 1).toArray(),
        created_at: '2021-01-01T00:00:00.000Z',
        updated_at: '2021-01-01T00:00:00.000Z',
        deleted_at: null,
    }),
    new Post({
        id: 2,
        title: 'My Second Post',
        content: 'This is my second post',
        published_at: '2021-01-01T00:00:00.000Z',
        author_id: 1,
        author: {
            id: 1,
            name: 'John Doe',
        },
        comments: comments.where('post_id', 2).toArray(),
        attachments: attachments.where('attachable_id', 2).toArray(),
        created_at: '2021-01-01T00:00:00.000Z',
        updated_at: '2021-01-01T00:00:00.000Z',
        deleted_at: '2021-01-01T00:00:00.000Z',
    }),
]) as Collection<Model>;

const users = collect([
    new User({
        id: 1,
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: null,
        posts: posts.where('author_id', 1).toArray(),
        comments: comments.where('author_id', 1).toArray(),
        attachments: attachments.where('author_id', 1).toArray(),
        chairs: [
            {
                id: 1,
                name: 'My Chair',
                description: 'This is my chair',
            }
        ],
        created_at: '2021-01-01T00:00:00.000Z',
        updated_at: '2021-01-01T00:00:00.000Z',
        deleted_at: null,
    })
]) as Collection<Model>;

const chairs = collect([
    new Chair({
        id: 1,
        name: 'My Chair',
        description: 'This is my chair',
        users: users.toArray(),
        created_at: '2021-01-01T00:00:00.000Z',
        updated_at: '2021-01-01T00:00:00.000Z',
        deleted_at: null,
    })
]);

//     (Http.post as any).mockImplementationOnce(() => Promise.resolve(new Response({ 
//         config: {
//             headers: { 'Content-Type': 'application/json' } as any,
//         },
//         data: { id: 1 }, 
//         headers: { 'Content-Type': 'application/json' },
//         status: 200, 
//         statusText: 'OK',
//     })));

//     /* * */

//     const file = await File.create({
//         path: '/path/to/file.jpg',
//         type: 'image',
//         attachment_id: 1,
//         attachment: null,
//         created_at: '2021-01-01T00:00:00.000Z',
//         updated_at: '2021-01-01T00:00:00.000Z',
//         deleted_at: null,
//     });
//     lazyFiles.push(file);

//     const attachment = await Attachment.create({
//         path: '/path/to/attachment.jpg',
//         type: 'image',
//         author_id: 1,
//         author: null,
//         file_id: 1,
//         file: null,
//         attachable: null,
//         attachable_type: 'post',
//         attachable_id: 1,
//         created_at: '2021-01-01T00:00:00.000Z',
//         updated_at: '2021-01-01T00:00:00.000Z',
//         deleted_at: '2021-01-01T00:00:00.000Z',
//     });
//     lazyAttachments.push(attachment);

//     const comment_1 = await Comment.create({
//         post_id: 1,
//         post: null,
//         content: 'foo bar',
//         user_id: 1,
//         user: null,
//         created_at: '2021-01-01T00:00:00.000Z',
//         updated_at: '2021-01-01T00:00:00.000Z',
//         deleted_at: null,
//     });
//     lazyComments.push(comment_1);

//     const comment_2 = await Comment.create({
//         post_id: 1,
//         post: null,
//         content: 'lorem ipsum',
//         user_id: 1,
//         user: null,
//         created_at: '2021-01-01T00:00:00.000Z',
//         updated_at: '2021-01-01T00:00:00.000Z',
//         deleted_at: null,
//     });
//     lazyComments.push(comment_2);

//     const post_1 = await Post.create({
//         title: 'First Post',
//         published: 1,
//         content: 'foo bar',
//         likes: '100',
//         author_id: 1,
//         author: null,
//         comments: [],
//         attachments: [],
//     });
//     lazyPosts.push(post_1);

//     const post_2 = await Post.create({
//         title: 'Second Post',
//         published: 1,
//         content: 'lorem ipsum',
//         likes: '10',
//         author_id: 1,
//         author: null,
//         comments: [],
//         attachments: [],
//     });
//     lazyPosts.push(post_2);

//     const user = await User.create({
//         name: 'John Doe',
//         email: 'johndoe@example.com',
//         password: null,
//         posts: [],
//         comments: [],
//         attachments: [],
//     });
//     lazyUsers.push(user);

// })();

/* * * * */

// lazyFiles.each((file) => {
//     // file.relation('attachments')!
//     //     .where('file_id', file.id)
//     //     .first();

//     file.save();
// });

// lazyAttachments.each((attachment) => {
//     attachment.relation('author')!
//         .where('id', attachment.author_id)
//         .first();

//     attachment.relation('file')!
//         .where('id', attachment.file_id)
//         .first();

//     attachment.relation('attachable')!
//         .where('id', attachment.attachable_id)
//         .first();

//     attachment.save();
// });

// lazyComments.each((comment) => {
//     comment.relation('user')!
//         .where('id', comment.user_id)
//         .first();

//     // comment.relation('post')!
//     //     .where('id', comment.post_id)
//     //     .first();

//     comment.save();
// });

// lazyPosts.each((post) => {
//     post.relation('author')!
//         .where('id', post.author_id)
//         .first();

//     // post.relation('comments')!
//     //     .where('post_id', post.id)
//     //     .get();

//     // post.relation('attachments')!
//     //     .where('attachable_id', post.id)
//     //     .get();

//     post.save();
// });

// lazyUsers.each((user) => {
//     // user.relation('posts')!
//     //     .where('author_id', user.id)
//     //     .get();

//     // user.relation('comments')!
//     //     .where('user_id', user.id)
//     //     .get();

//     user.relation('attachments')!
//         .where('attachable_id', user.id)
//         .get();

//     user.save();
// });

/* * * * */

const user = users.first()!;

// console.log({ 
//     user, 
//     posts: user.posts.items, 
//     comments: user.comments.items, 
//     attachments: user.attachments.items, 
// });

const post = user && user.posts.items ? user.posts.items[0] : null;
const comment = user && user.comments.items ? user.comments.items[0] : null;

const author = post && post.author ? post.author : null;
const attachment = post && post.attachments ? post.attachments.items[0] : null;
const file = files.first()!;

const chair = chairs.first()!;

// console.log({ user, post, author, attachment, comment, file, chair });

/* * * * */

const userRelations = user && user.relations ? user.relations : null;

const postRelations = post && post.relations ? post.relations : null;
const commentRelations = comment && comment.relations ? comment.relations : null;

const authorRelations = author && author.relations ? author.relations : null;
const attachmentRelations = attachment && attachment.relations ? attachment.relations : null;
const fileRelations = file && file.relations ? file.relations : null;

const chairRelations = chair && chair.relations ? chair.relations : null;

// console.log({
//     user_relations: userRelations,
//     post_relations: postRelations,
//     author_relations: authorRelations,
//     attachment_relations: attachmentRelations,
//     comment_relations: commentRelations,
//     file_relations: fileRelations,
//     chair_relations: chairRelations,
// });

/* * * * */

export default {
    app: { 
        App, 
        baseModel,
    },
    models: {
        User,
        Post,
        File,
        Attachment,
        Comment,
        Chair,
    },
    data: {
        users,
        posts,
        attachments,
        comments,
        files,
        chairs,
        //
        user,
        post,
        author,
        attachment,
        comment,
        file,
        chair,
        //
        userRelations,
        postRelations,
        authorRelations,
        attachmentRelations,
        commentRelations,
        fileRelations,
        chairRelations,
    }
};
