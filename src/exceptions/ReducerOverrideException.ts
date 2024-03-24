
export default class ReducerOverrideException extends Error {
    static name = 'ReducerOverrideException';

    constructor(name: string, target: unknown) {
        super(`[Luminix] Cannot create reducer '${name}' on '${target}' as it is a reserved property`);
    }
}