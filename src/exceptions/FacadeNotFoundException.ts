
export default class FacadeNotFoundException extends Error {
    static name = 'FacadeNotFoundException';

    constructor(name: string) {
        super(`[Luminix] Facade "${name}" not found`);
    }
}