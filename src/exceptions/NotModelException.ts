
export default class NotModelException extends TypeError {
    static name = 'NotModelException';

    constructor(caller: string, expects = 'Model') {
        super(`[Luminix] "${caller}" expects ${expects}`);
    }
}