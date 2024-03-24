
export default class NoInverseRelationException extends Error {
    static name = 'NoInverseRelationException';

    constructor(model: string, relation: string, related: string, relatedRelation: string) {
        super(`[Luminix] Could not determine inverse relation for "${relation}" in model "${model}". ` +
            `Please specify a relation in model "${related}" of type ${relatedRelation} that points back to "${model}".`);
    }
}
