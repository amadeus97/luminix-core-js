import Collection from '../contracts/ComposedCollection';

export default function collect<T = unknown>(items: T[]) {
    if (!Array.isArray(items)) {
        throw new TypeError('collect() expects an array');
    }

    return new Collection(items);
}
