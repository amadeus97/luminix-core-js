
export default class MethodNotImplementedException extends Error {

    [Symbol.toStringTag] = 'MethodNotImplementedException';

    constructor() {
        super('[Luminix] Method not implemented.');
    }
}

