

export default class RouteNotFoundException extends Error {

    static name = 'RouteNotFoundException';

    constructor(route: string) {
        super(`[Luminix] Route "${route}" not found`);
    }
}
