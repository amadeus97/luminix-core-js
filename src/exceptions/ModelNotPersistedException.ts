
export default class ModelNotPersistedException extends Error {
    static name = 'ModelNotPersistedException';

    constructor(model: string, operation: string) {
        super(`[Luminix] Model "${model}" must be persisted before calling "${operation}"`);
    }
}