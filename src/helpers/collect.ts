import { collect as collectBase } from '../contracts/Collection';

export default function collect<T = unknown>(items: T[]) {
    return collectBase(items);
}
