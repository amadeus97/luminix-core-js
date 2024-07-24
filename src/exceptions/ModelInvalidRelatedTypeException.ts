
export default class ModelInvalidRelatedTypeException extends TypeError {
    [Symbol.toStringTag] = 'ModelInvalidRelatedTypeException';

    constructor(caller: string, expectedType: string, relatedType: string) {
        super(`[Luminix] "${caller}" expects a related model of type "${expectedType}". Received "${relatedType}" instead.`);
    }
}