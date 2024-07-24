
export default class NotReducibleException extends Error {

    [Symbol.toStringTag] = 'NotReducibleException';

    constructor(facade: unknown) {
        super(`[Luminix] Expected ${facade} to be reducible.`);
    }

}
