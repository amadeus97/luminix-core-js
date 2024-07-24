
export default class ReducerOverrideException extends Error {
    [Symbol.toStringTag] = 'ReducerOverrideException';

    constructor(name: string, target: unknown) {
        super(`[Luminix] Cannot create reducer '${name}' on '${target}' as it is a reserved property`);
    }
}