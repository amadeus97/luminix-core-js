
export default class ModelWithoutPrimaryKeyException extends Error {
    static name = 'ModelWithoutPrimaryKeyException';

    constructor(model: string) {
        super(`[Luminix] Model "${model}" does not have a primary key`);
    }
}


