import { Unsubscribe } from 'nanoevents';
import { HasEvents } from '../mixins/HasEvents';
import { CollectionEvents, Operator } from '../types/Collection';


export class Collection<T = unknown> extends Array<T> {

    static name = 'Collection';

    // methods that mutates the collection
    fill(value: T, start?: number | undefined, end?: number | undefined): this {
        super.fill(value, start, end);
        this.emit('change');
        
        return this;
    }

    push(...items: T[]): number {
        const result = super.push(...items);
        this.emit('change');
        
        return result;
    }

    pop(): T | undefined {
        const result = super.pop();
        this.emit('change');
        
        return result;
    }

    shift(): T | undefined {
        const result = super.shift();
        this.emit('change');
        
        return result;
    }

    unshift(...items: T[]): number {
        const result = super.unshift(...items);
        this.emit('change');
        
        return result;
    }

    splice(start: number): Collection<T>;
    splice(start: number, deleteCount: number): Collection<T>;
    splice(start: number, deleteCount: number, ...items: T[]): Collection<T>;
    splice(start: number, deleteCount?: number, ...items: T[]): Collection<T> {
        const toDelete = typeof deleteCount === 'undefined' 
            ? this.length - start 
            : deleteCount;
        const result = super.splice(start, toDelete, ...items);
        this.emit('change');
        
        return result as Collection<T>;
    }

    reverse(): this {
        super.reverse();
        this.emit('change');
        return this;
    }

    sort(compareFn?: (a: T, b: T) => number): this {
        super.sort(compareFn);
        this.emit('change');
        return this;
    }

    // methods that should return a new collection


    // Eloquent collection methods

    tap(callback: (collection: this) => void): this {
        callback(this);
        return this;
    }

    pluck<K extends keyof T>(key: K): Collection<T[K]> {
        return this.map((item) => item[key]) as Collection<T[K]>;
    }

    first(): T | undefined {
        return this[0];
    }

    last(): T | undefined {
        return this[this.length - 1];
    }


    average(key?: keyof T) {
        if (this.length === 0) {
            return 0;
        }

        if (typeof key === 'undefined') {
            if (!this.every((i) => typeof i === 'number')) {
                throw new TypeError('Cannot calculate average of non-numeric values');
            }
            return (this as Collection<number>).reduce((a: number, b: number) => a + b) / this.length;
        }

        if (!this.every((i) => typeof i === 'object'
            && i !== null
            && key in i
            && typeof i[key] === 'number')) {

            throw new TypeError('Cannot calculate average of non-numeric values');
        }

        return this.reduce((a, b) => a + (b[key] as number), 0) / this.length;
    }

    avg(key?: keyof T) {
        return this.average(key);
    }

    chunk(size: number): Collection<Collection<T>> {
        const result: Collection<Collection<T>> = new (HasEvents(Collection))();

        for (let i = 0; i < this.length; i += size) {
            result.push(this.slice(i, i + size) as Collection<T>);
        }

        return result;
    }

    chunkWhile(callback: (value: T, key: number, collection: T[]) => boolean): Collection<Collection<T>> {
        const result: Collection<Collection<T>> = new (HasEvents(Collection))();
        let chunk: Collection<T> = new (HasEvents(Collection))();

        for (let i = 0; i < this.length; i++) {
            if (callback(this[i], i, this)) {
                chunk.push(this[i]);
            } else if (chunk.length > 0) {
                result.push(chunk);
                chunk = new (HasEvents(Collection))();
            }
        }

        if (chunk.length > 0) {
            result.push(chunk);
        }

        return result;
    }

    diff(collection: Collection<T>): Collection<T> {
        return this.filter((i) => !collection.includes(i)) as Collection<T>;
    }

    intersect(collection: Collection<T>): Collection<T> {
        return this.filter((i) => collection.includes(i)) as Collection<T>;
    }

    // firstWhere(key: keyof T, value: unknown): T | undefined {
    //     return this.find((i) => i[key] === value);
    // }

    firstWhere(key: keyof T, value: unknown): T | undefined
    firstWhere(key: keyof T, operator: Operator, value: unknown): T | undefined
    firstWhere(key: keyof T, operator: Operator | unknown, value?: unknown): T | undefined {
        if (typeof value === 'undefined' || value === null) {
            return this.find((i) => i[key] == operator);
        }

        const OperationPredicates = {
            '=': (item: T) => item[key] == value,
            '!=': (item: T) => item[key] != value,
            '>': (item: T) => item[key] > value,
            '>=': (item: T) => item[key] >= value,
            '<': (item: T) => item[key] < value,
            '<=': (item: T) => item[key] <= value,
        };

        if (typeof operator !== 'string' || !(operator in OperationPredicates)) {
            throw new TypeError(`Invalid operator: ${operator}`);
        }

        return this.find((i) => OperationPredicates[operator as Operator](i));
    }


    isEmpty(): boolean {
        return this.length === 0;
    }

    isNotEmpty(): boolean {
        return !this.isEmpty();
    }

    lastWhere(key: keyof T, value: unknown): T | undefined
    lastWhere(key: keyof T, operator: Operator, value: unknown): T | undefined
    lastWhere(key: keyof T, operator: Operator | unknown, value?: unknown): T | undefined {
        if (typeof value === 'undefined' || value === null) {
            for (let i = this.length - 1; i >= 0; i--) {
                if (this[i][key] == operator) {
                    return this[i];
                }
            }
            return undefined;
        }

        const OperationPredicates = {
            '=': (item: T) => item[key] == value,
            '!=': (item: T) => item[key] != value,
            '>': (item: T) => item[key] > value,
            '>=': (item: T) => item[key] >= value,
            '<': (item: T) => item[key] < value,
            '<=': (item: T) => item[key] <= value,
        };

        if (typeof operator !== 'string' || !(operator in OperationPredicates)) {
            throw new TypeError(`Invalid operator: ${operator}`);
        }

        for (let i = this.length - 1; i >= 0; i--) {
            if (OperationPredicates[operator as Operator](this[i])) {
                return this[i];
            }
        }

        return undefined;
    }

    max(key?: string): number | undefined {
        if (this.length === 0) {
            return undefined;
        }

        if (typeof key === 'undefined') {
            if (!this.every((i) => typeof i === 'number')) {
                throw new TypeError('Cannot calculate max of non-numeric values');
            }
            return Math.max(...(this as Collection<number>));
        }

        if (!this.every((i) => typeof i === 'object'
            && i !== null
            && key in i
            && typeof (i as Record<string, number>)[key] === 'number')) {

            throw new TypeError('Cannot calculate max of non-numeric values');
        }

        return Math.max(...this.map((i) => (i as Record<string, number>)[key]));
    }

    median(key?: string): number | undefined {
        if (this.length === 0) {
            return undefined;
        }

        if (typeof key === 'undefined') {
            if (!this.every((i) => typeof i === 'number')) {
                throw new TypeError('Cannot calculate median of non-numeric values');
            }
            const sorted = (this as Collection<number>).sort();
            const middle = Math.floor(sorted.length / 2);
            return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
        }

        if (!this.every((i) => typeof i === 'object'
            && i !== null
            && key in i
            && typeof (i as Record<string, number>)[key] === 'number')) {

            throw new TypeError('Cannot calculate median of non-numeric values');
        }

        const sorted = this.map((i) => (i as Record<string, number>)[key]).sort();
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
    }

    min(key?: string): number | undefined {
        if (this.length === 0) {
            return undefined;
        }

        if (typeof key === 'undefined') {
            if (!this.every((i) => typeof i === 'number')) {
                throw new TypeError('Cannot calculate min of non-numeric values');
            }
            return Math.min(...(this as Collection<number>));
        }

        if (!this.every((i) => typeof i === 'object'
            && i !== null
            && key in i
            && typeof (i as Record<string, number>)[key] === 'number')) {

            throw new TypeError('Cannot calculate min of non-numeric values');
        }

        return Math.min(...this.map((i) => (i as Record<string, number>)[key]));
    }
    
    mode(key?: string): number | undefined {
        if (this.length === 0) {
            return undefined;
        }

        if (typeof key === 'undefined') {
            if (!this.every((i) => typeof i === 'number')) {
                throw new TypeError('Cannot calculate mode of non-numeric values');
            }
            const counts = new Map<number, number>();
            (this as Collection<number>).forEach((i) => {
                const count = counts.get(i) || 0;
                counts.set(i, count + 1);
            });
            const maxCount = Math.max(...counts.values());
            return [...counts].find(([, count]) => count === maxCount)![0];
        }

        if (!this.every((i) => typeof i === 'object'
            && i !== null
            && key in i
            && typeof (i as Record<string, number>)[key] === 'number')) {

            throw new TypeError('Cannot calculate mode of non-numeric values');
        }

        const counts = new Map<number, number>();
        this.map((i) => (i as Record<string, number>)[key]).forEach((i) => {
            const count = counts.get(i) || 0;
            counts.set(i, count + 1);
        });
        const maxCount = Math.max(...counts.values());
        return [...counts].find(([, count]) => count === maxCount)![0];
    }

    pad(size: number, value: T): Collection<T> {
        if (size <= this.length) {
            return this;
        }

        return new (HasEvents(Collection))(...this, ...new Array(size - this.length).fill(value));
    }

    partition(callback: (value: T, key: number, collection: T[]) => boolean): [Collection<T>, Collection<T>] {
        const result: [Collection<T>, Collection<T>] = [new (HasEvents(Collection))(), new (HasEvents(Collection))()];

        this.forEach((i, k) => {
            if (callback(i, k, this)) {
                result[0].push(i);
            } else {
                result[1].push(i);
            }
        });

        return result;
    }

    percentage(callback: (value: T, key: number, collection: T[]) => boolean): number {
        return (this.filter(callback).length / this.length) * 100;
    }

    pull(index: number): T | undefined {
        const result = super.splice(index, 1)[0];
        this.emit('change');
        
        return result;
    }

    random(length: number = 1): Collection<T> {
        const result: Collection<T> = new (HasEvents(Collection))();

        const indexes: number[] = [];

        while (indexes.length < length) {
            const index = Math.floor(Math.random() * this.length);
            if (!indexes.includes(index)) {
                indexes.push(index);
                result.push(this[index]);
            }
        }

        return result;
    }

    reject(callback: (value: T, key: number, collection: T[]) => boolean): Collection<T> {
        return this.filter((i, k) => !callback(i, k, this)) as Collection<T>;
    }

    replace(index: number, item: T): T | undefined {
        return this.splice(index, 1, item)[0];
    }

    shuffle(): Collection<T> {
        return this.random(this.length);
    }

    sortBy(key: keyof T): Collection<T> {
        return this.sort((a, b) => {
            if (a[key] < b[key]) {
                return -1;
            }
            if (a[key] > b[key]) {
                return 1;
            }
            return 0;
        });
    }

    sortByDesc(key: keyof T): Collection<T> {
        return this.sort((a, b) => {
            if (a[key] > b[key]) {
                return -1;
            }
            if (a[key] < b[key]) {
                return 1;
            }
            return 0;
        });
    }

    sortDesc(): Collection<T> {
        return this.sort((a, b) => {
            if (a < b) {
                return 1;
            }
            if (a > b) {
                return -1;
            }
            return 0;
        });
    }

    split(size: number): Collection<Collection<T>> {
        const result: Collection<Collection<T>> = new (HasEvents(Collection))();

        const groupSize = Math.ceil(this.length / size);

        for (let i = 0; i < this.length; i += groupSize) {
            result.push(this.slice(i, i + groupSize) as Collection<T>);
        }

        return result;
    }

    sum(key?: string): number {
        if (this.length === 0) {
            return 0;
        }

        if (typeof key === 'undefined') {
            if (!this.every((i) => typeof i === 'number')) {
                throw new TypeError('Cannot calculate sum of non-numeric values');
            }
            return (this as Collection<number>).reduce((a, b) => a + b);
        }

        if (!this.every((i) => typeof i === 'object'
            && i !== null
            && key in i
            && typeof (i as Record<string, number>)[key] === 'number')) {

            throw new TypeError('Cannot calculate sum of non-numeric values');
        }

        return this.reduce((a, b) => a + (b as Record<string, number>)[key], 0);
    }

    take(amount: number): Collection<T> {
        return this.slice(0, amount) as Collection<T>;
    }

    takeUntil(callback: (value: T, key: number, collection: T[]) => boolean): Collection<T> {
        const result: T[] = [];

        for (let i = 0; i < this.length; i++) {
            if (callback(this[i], i, this)) {
                break;
            }
            result.push(this[i]);
        }

        return new (HasEvents(Collection))(...result);
    }

    takeWhile(callback: (value: T, key: number, collection: T[]) => boolean): Collection<T> {
        const result: T[] = [];

        for (let i = 0; i < this.length; i++) {
            if (!callback(this[i], i, this)) {
                break;
            }
            result.push(this[i]);
        }

        return new (HasEvents(Collection))(...result);
    }

    unique(key?: keyof T): Collection<T>
    unique(callback: (value: T, key: number, collection: T[]) => boolean): Collection<T>
    unique(key?: (keyof T)|((value: T, key: number, collection: T[]) => boolean)): Collection<T> {
        if (typeof key === 'undefined') {
            return this.filter((i, k) => this.findIndex((j) => j == i) === k) as Collection<T>;
        }

        if (typeof key === 'function') {
            return this.filter((i, k) => this.findIndex(() => key(i, k, this)) === k) as Collection<T>;
        }

        return this.filter((i, k) => this.findIndex((j) => j[key] == i[key]) === k) as Collection<T>;
    }


    where(key: keyof T, value: unknown): Collection<T>
    where(key: keyof T, operator: Operator, value: unknown): Collection<T>
    where(key: keyof T, operator: Operator | unknown, value?: unknown): Collection<T> {
        if (typeof value === 'undefined' || value === null) {
            return this.filter(item => item[key] == operator) as Collection<T>;
        }

        const OperationPredicates = {
            '=': (item: T) => item[key] == value,
            '!=': (item: T) => item[key] != value,
            '>': (item: T) => item[key] > value,
            '>=': (item: T) => item[key] >= value,
            '<': (item: T) => item[key] < value,
            '<=': (item: T) => item[key] <= value,
        };

        if (typeof operator !== 'string' || !(operator in OperationPredicates)) {
            throw new TypeError(`Invalid operator: ${operator}`);
        }

        return this.filter(item => OperationPredicates[operator as Operator](item)) as Collection<T>;
        
    }

    whereStrict(key: keyof T, value: unknown): Collection<T>
    whereStrict(key: keyof T, operator: Operator, value: unknown): Collection<T>
    whereStrict(key: keyof T, operator: Operator | unknown, value?: unknown): Collection<T> {
        if (typeof value === 'undefined' || value === null) {
            return this.filter(item => item[key] === operator) as Collection<T>;
        }

        const OperationPredicates = {
            '=': (item: T) => item[key] === value,
            '!=': (item: T) => item[key] !== value,
            '>': (item: T) => item[key] > value,
            '>=': (item: T) => item[key] >= value,
            '<': (item: T) => item[key] < value,
            '<=': (item: T) => item[key] <= value,
        };

        if (typeof operator !== 'string' || !(operator in OperationPredicates)) {
            throw new TypeError(`Invalid operator: ${operator}`);
        }

        return this.filter(item => OperationPredicates[operator as Operator](item)) as Collection<T>;
    }

    whereBetween(key: keyof T, values: [number, number]): Collection<T> {
        if (!this.every((i) => typeof i === 'object'
            && i !== null
            && key in i
            && typeof i[key] === 'number')) {

            throw new TypeError('Cannot filter non-numeric values');
        }

        return this.filter((item) => (item[key] as number) >= values[0] && (item[key] as number) <= values[1]) as Collection<T>;
    }
    
    whereIn(key: keyof T, values: unknown[]): Collection<T> {
        return this.filter((item) => values.includes(item[key])) as Collection<T>;
    }

    whereNotBetween(key: keyof T, values: [number, number]): Collection<T> {
        if (!this.every((i) => typeof i === 'object'
            && i !== null
            && key in i
            && typeof i[key] === 'number')) {

            throw new TypeError('Cannot filter non-numeric values');
        }

        return this.filter((item) => (item[key] as number) < values[0] || (item[key] as number) > values[1]) as Collection<T>;
    }

    whereNotIn(key: keyof T, values: unknown[]): Collection<T> {
        return this.filter((item) => !values.includes(item[key])) as Collection<T>;
    }

    whereNotNull(key: keyof T): Collection<T> {
        return this.filter((item) => item[key] !== null && item[key] !== undefined) as Collection<T>;
    }

    whereNull(key: keyof T): Collection<T> {
        return this.filter((item) => item[key] === null || item[key] === undefined) as Collection<T>;
    }



    // Luminix methods

    /**
     * Removes all items from the collection
     * 
     * @returns {this}
     */
    flush(): this {
        if (this.length > 0) {
            this.splice(0, this.length);
            this.emit('change');
            
        }
        return this;
    }

    /**
     * Copies the collection to a new Collection
     * 
     * @returns {Collection<T>} 
     */
    copy(): Collection<T> {
        return this.slice() as Collection<T>;
    }





    // HasEvents methods

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public on<K extends keyof CollectionEvents>(_: K, __: CollectionEvents[K]): Unsubscribe {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public once<K extends keyof CollectionEvents>(_: K, __: CollectionEvents[K]): void {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public emit<K extends keyof CollectionEvents>(_: K, __?: Omit<Parameters<CollectionEvents[K]>[0], 'source'>): void {
        throw new Error('Method not implemented.');
    }

}

const CollectionWithEvents = HasEvents<CollectionEvents, typeof Collection>(Collection);

export default CollectionWithEvents;


