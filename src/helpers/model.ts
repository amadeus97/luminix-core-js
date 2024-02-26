import { ProxyModel, RepositoryFacade } from "../types/Model";

import app from './app';

function model(): RepositoryFacade;
function model(className: string): typeof ProxyModel;

function model(className?: string) {
    const repository = app('repository');
    if (!className) {
        return repository;
    }

    return repository.make(className);
}

export default model;
