import { Model, RepositoryFacade } from '../types/Model';

import app from './app';

function model(): RepositoryFacade;
function model(abstract: string): typeof Model;

function model(abstract?: string) {
    const repository = app('repository');
    if (!abstract) {
        return repository;
    }

    return repository.make(abstract);
}

export default model;
