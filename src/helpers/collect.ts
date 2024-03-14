import Collection from '../contracts/Collection';

export default function collect<T = unknown>(items: T[]) {
    return new Collection(...items);
}
