
export default class MethodNotImplementedException extends Error {

    static name = 'MethodNotImplementedException';

    constructor() {
        super('[Luminix] Method not implemented.');
    }
}

