
export type RouteReplacer = false | { [key: string]: string | number };

export type RouteFacade = {
    get(name: string, replace?: RouteReplacer): string;
    exists(name: string): boolean;
}

export type RouteDefinition = {
    [routeName: string]: string | RouteDefinition;
}