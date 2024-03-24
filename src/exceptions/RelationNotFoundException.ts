
export default class RelationNotFoundException extends Error {
    static name = 'RelationNotFoundException';

    constructor(model: string, name?: string) {
        super(name
            ? `[Luminix] Relation "${name}" not found in model "${model}"`
            : `[Luminix] Relation not found in model "${model}"`);
    }
}