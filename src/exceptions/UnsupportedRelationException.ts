
export default class UnsupportedRelationException extends Error {
    static name = 'UnsupportedRelationException';

    constructor(relation: string) {
        super(`[Luminix] Relation "${relation}" is not supported`);
    }
}