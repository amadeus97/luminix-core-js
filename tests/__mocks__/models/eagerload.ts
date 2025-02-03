/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Collection } from '@luminix/support';

import App from '../../../src/facades/App';

function collect<T = unknown>(items: T[]) {
    return new Collection(items);
}

const baseModel = App.make('model');

const User = baseModel.make('user');
const Post = baseModel.make('post');

const File = baseModel.make('file');
const Attachment = baseModel.make('attachment');
const Comment = baseModel.make('post_comment');

/* * * * */

const files = collect([
    new File()
]);

const attachments = collect([
    new Attachment()
]);

const comments = collect([
    new Comment(),
    new Comment(),
]);

const posts = collect([
    new Post(),
    new Post(),
]);

const users = collect([
    new User()
]);

export default {
    users,
    posts,
    comments,
    attachments,
    files,
};
