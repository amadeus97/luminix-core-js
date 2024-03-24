

export default class AttributeNotFillableException extends Error {

    static name = 'AttributeNotFillableException';

    constructor(abstract: string, attribute: string) {
        super(`[Luminix] Attribute "${attribute}" in model "${abstract}" is not fillable`);
    }
}

