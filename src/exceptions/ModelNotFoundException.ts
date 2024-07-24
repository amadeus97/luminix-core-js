
export default class ModelNotFoundException extends Error {

    [Symbol.toStringTag] = 'ModelNotFoundException';

    constructor(model: string) {
        super(`[Luminix] Model "${model}" not found`);
    }
}
