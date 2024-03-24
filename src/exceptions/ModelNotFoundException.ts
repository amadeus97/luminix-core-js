
export default class ModelNotFoundException extends Error {

    static name = 'ModelNotFoundException';

    constructor(model: string) {
        super(`[Luminix] Model "${model}" not found`);
    }
}
