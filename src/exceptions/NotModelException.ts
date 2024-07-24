
export default class NotModelException extends TypeError {
    [Symbol.toStringTag] = 'NotModelException';

    constructor(caller: string, expects = 'Model') {
        super(`[Luminix] "${caller}" expects ${expects}`);
    }
}