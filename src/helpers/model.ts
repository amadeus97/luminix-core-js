import Repository from "../containers/Repository";
import { ModelHelper } from "../types/Model";

import app from './app';

const model = ((className?) => {
    const repository = app('repository') as Repository;

    if (typeof className === 'string') {
        return repository.getModelClass(className);
    }

    return repository;
}) as ModelHelper;

export default model;
