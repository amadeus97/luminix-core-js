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
        id: 1,
        path: '/path/to/file.jpg',
        type: 'image',
        attachment_id: 1,
        attachment: null,
        // attachment: {
        //     id: 1,
        //     path: '/path/to/attachment.jpg',
        //     type: 'image',
        // },
        created_at: '2021-01-01T00:00:00.000Z',
        updated_at: '2021-01-01T00:00:00.000Z',
        deleted_at: null,
    })
]) as Collection<Model>;

const attachments = collect([
    new Attachment({
        id: 1,
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
            path: '/path/to/file.jpg',
            type: 'image',
            attachment_id: 1,
            attachment: null,
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: null,
        },
        attachable: null,
        // attachable: {
        //     id: 1,
        //     title: 'My Post',
        //     content: 'This is my post',
        //     published_at: '2021-01-01T00:00:00.000Z',
        //     author_id: 1,
        //     author: {
        //         id: 1,
        //         name: 'John Doe',
        //     },
        //     comments: [],
        //     attachments: [],
        //     created_at: '2021-01-01T00:00:00.000Z',
        //     updated_at: '2021-01-01T00:00:00.000Z',
        //     deleted_at: null,
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
    }),
    new User({
        id: 2,
        name: 'Jane Doe',
        email: 'janedoe@example.com',
        password: null,
        posts: [],
        comments: [],
        attachments: [],
        chairs: [],
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

/* * * * */

const user = users.first()!;

const post = posts.first()!;
const comment = comments.first()!;

const author = post && post.author ? post.author : null;
const attachment = attachments.first()!;
const file = files.first()!;

const chair = chairs.first()!;

/* * * * */

const userRelations = user && user.relations ? user.relations : null;

const postRelations = post && post.relations ? post.relations : null;
const commentRelations = comment && comment.relations ? comment.relations : null;

const authorRelations = author && author.relations ? author.relations : null;
const attachmentRelations = attachment && attachment.relations ? attachment.relations : null;
const fileRelations = file && file.relations ? file.relations : null;

const chairRelations = chair && chair.relations ? chair.relations : null;

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
