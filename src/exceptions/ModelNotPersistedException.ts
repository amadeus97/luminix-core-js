
export default class ModelNotPersistedException extends Error {
    [Symbol.toStringTag] = 'ModelNotPersistedException';

    constructor(model: string, operation: string) {
        super(`[Luminix] Model "${model}" must be persisted before calling "${operation}"`);
    }
}