
export default class NotReducibleException extends Error {

    static name = 'NotReducibleException';

    constructor(facade: unknown) {
        super(`[Luminix] Expected ${facade} to be reducible.`);
    }

}
