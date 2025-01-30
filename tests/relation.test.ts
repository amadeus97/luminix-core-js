/* eslint-disable @typescript-eslint/no-explicit-any */

import App from '../src/facades/App';

import BelongsTo from '../src/contracts/Relation/BelongsTo';
import BelongsToMany from '../src/contracts/Relation/BelongsToMany';
import HasMany from '../src/contracts/Relation/HasMany';
import HasOne from '../src/contracts/Relation/HasOne';
import HasOneOrMany from '../src/contracts/Relation/HasOneOrMany';
import MorphMany from '../src/contracts/Relation/MorphMany';
import MorphOne from '../src/contracts/Relation/MorphOne';
import MorphOneOrMany from '../src/contracts/Relation/MorphOneOrMany';
import MorphTo from '../src/contracts/Relation/MorphTo';
import MorphToMany from '../src/contracts/Relation/MorphToMany';

import makeConfig from './config';

App.withConfiguration(makeConfig());
App.create();

beforeEach(() => {
    jest.resetModules();
});

describe('testing model relations', () => {

    const baseModel = App.make('model');

    const Role = baseModel.make('role');
    const User = baseModel.make('user');
    const Post = baseModel.make('post');
    const Comment = baseModel.make('comment');

    const Roles = [
        new Role({
            id: 1,
            name: 'Admin',
            created_at: '2021-01-01T00:00:00.000Z',
        }),
        new Role({
            id: 2,
            name: 'User',
            created_at: '2021-01-01T00:00:00.000Z',
        }),
    ];

    const Users = [
        new User({
            id: 1,
            name: 'John Doe',
            email: 'johndoe@example.com',
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: '2021-01-01T00:00:00.000Z',
            password: 'password',
        }),
    ];

    const Posts = [
        new Post({
            id: 1,
            title: 'First Post',
            published_at: '2021-01-01T00:00:00.000Z',
            published: 1,
            content: 'foo bar',
            likes: '100',
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: '2021-01-01T00:00:00.000Z',
        }),
        new Post({
            id: 2,
            title: 'Second Post',
            published_at: '2021-01-01T00:00:00.000Z',
            published: 1,
            content: 'lorem ipsum',
            likes: '10',
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: null,
        }),
    ];

    const Comments = [
        new Comment({
            id: 1,
            body: 'First Comment',
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: '2021-01-01T00:00:00.000Z',
        }),
        new Comment({
            id: 2,
            body: 'Second Comment',
            created_at: '2021-01-01T00:00:00.000Z',
            updated_at: '2021-01-01T00:00:00.000Z',
            deleted_at: null,
        }),
    ];

    test('', () => {
        
    });

});