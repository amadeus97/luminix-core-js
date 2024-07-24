

export default class AttributeNotFillableException extends Error {

    [Symbol.toStringTag] = 'AttributeNotFillableException';

    constructor(abstract: string, attribute: string) {
        super(`[Luminix] Attribute "${attribute}" in model "${abstract}" is not fillable`);
    }
}

