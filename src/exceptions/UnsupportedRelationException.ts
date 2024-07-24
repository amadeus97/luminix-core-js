
export default class UnsupportedRelationException extends Error {
    [Symbol.toStringTag] = 'UnsupportedRelationException';

    constructor(relation: string) {
        super(`[Luminix] Relation "${relation}" is not supported`);
    }
}