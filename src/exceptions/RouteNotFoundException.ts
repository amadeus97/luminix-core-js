

export default class RouteNotFoundException extends Error {

    [Symbol.toStringTag] = 'RouteNotFoundException';

    constructor(route: string) {
        super(`[Luminix] Route "${route}" not found`);
    }
}
