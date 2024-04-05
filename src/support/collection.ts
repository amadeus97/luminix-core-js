import { Collection } from '../types/Collection';


export function cartesian<T>(...arrays: T[][]): T[][] {
    return arrays.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())) as T[]) as T[][];
}


export function isCollection(instance: unknown): instance is Collection {
    if (typeof instance !== 'object' || instance === null) {
        return false;
    }

    if (!Reflect.has(instance, 'constructor')) {
        return false;
    }

    if (Reflect.get(instance.constructor, 'name') !== 'Collection') {
        return false;
    }

    return true;
}

