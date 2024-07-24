
export default class ModelWithoutPrimaryKeyException extends Error {
    [Symbol.toStringTag] = 'ModelWithoutPrimaryKeyException';

    constructor(model: string) {
        super(`[Luminix] Model "${model}" does not have a primary key`);
    }
}


