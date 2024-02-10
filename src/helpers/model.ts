import { ModelHelper } from "../types/Model";

import app from './app';

export default ((className?: string) => {
    const repository = app('repository');
    if (!className) {
        return repository;
    }

    return repository.make(className);
}) as ModelHelper;
