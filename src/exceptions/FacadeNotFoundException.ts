
export default class FacadeNotFoundException extends Error {
    [Symbol.toStringTag] = 'FacadeNotFoundException';

    constructor(name: string) {
        super(`[Luminix] Facade "${name}" not found`);
    }
}