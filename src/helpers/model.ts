import { ModelHelper } from "../types/Model";

import app from './app';

const model = ((className?) => {
    const repository = app('repository');

    if (typeof className === 'string') {
        return repository.getModelClass(className);
    }

    return repository;
}) as ModelHelper;

export default model;
