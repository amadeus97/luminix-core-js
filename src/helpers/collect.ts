import { Collection } from '@luminix/support';

export default function collect<T = unknown>(items: T[]) {
    return new Collection(items);
}
