import { Model, RepositoryFacade } from '../types/Model';

import app from './app';

function model(): RepositoryFacade;
function model(className: string): typeof Model;

function model(className?: string) {
    const repository = app('repository');
    if (!className) {
        return repository;
    }

    return repository.make(className);
}

export default model;
