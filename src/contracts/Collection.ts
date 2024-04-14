
import { HasEvents } from '../mixins/HasEvents';
import { CollectionEvents , Operator, Collection as CollectionInterface, CollectionIteratorCallback, CollectionPipeCallback, CollectionSortCallback } from '../types/Collection';

import { JsonValue, Constructor, TypeOf } from '../types/Support';
import _ from 'lodash';
import { cartesian, isCollection } from '../support/collection';
import MethodNotImplementedException from '../exceptions/MethodNotImplementedException';
import { Unsubscribe } from 'nanoevents';



export function collect<T = unknown, C extends typeof Collection<T> = typeof Collection<T>>(items: T[] = [], constructor: C = Collection as C): CollectionInterface<T> {
    if (!Array.isArray(items)) {
        throw new TypeError('collect() expects an array');
    }

    return new (HasEvents<CollectionEvents<T>, C>(constructor))([...items]);
}

const emitChange = (collection: Collection<unknown>) => {
    collection.emit('change', {
        items: collection.all(),
    });
};

const get = <T>(arrayOrCollection: T[] | CollectionInterface<T>, index: number): T | null => {
    if (Array.isArray(arrayOrCollection)) {
        return arrayOrCollection[index] ?? null;
    }

    return arrayOrCollection.get(index);
};

export class Collection<T> implements CollectionInterface<T> {

    static name = 'Collection';

    #items: T[];

    constructor(
        items: Array<T> = []
    ) {
        this.#items = items;
    }

    get items() {
        return [...this.#items];
    }

    [Symbol.iterator]() {
        return this.#items[Symbol.iterator]();
    }

    [Symbol.toStringTag] = this.constructor.name;

    all(): T[] {
        return [...this.#items];
    }

    average(): number
    average<K extends keyof T>(key: K): number;
    average(key?: keyof T): number {
        if (typeof key === 'string') {
            return this.avg(key);
        }
        return this.avg();
    }

    avg(): number
    avg<K extends keyof T>(key: K): number;
    avg(key?: keyof T): number {
        
        if (typeof key === 'string') {
            return this.sum(key) / this.#items.length;
        }

        return this.sum() / this.#items.length;
    }

    chunk(size: number): CollectionInterface<CollectionInterface<T>> {
        const chunks = [];
        for (let i = 0; i < this.#items.length; i += size) {
            chunks.push(this.#items.slice(i, i + size));
        }

        return collect(chunks.map(chunk => collect(chunk)));
    }

    chunkWhile(callback: CollectionIteratorCallback<T, boolean>): CollectionInterface<CollectionInterface<T>> {
        const chunks = [];
        let nextChunk = collect<T>();
        for (let i = 0; i < this.#items.length; i++) {
            if (callback(this.#items[i], i, nextChunk)) {
                nextChunk.push(this.#items[i]);
            } else {
                chunks.push(nextChunk);
                nextChunk = collect<T>();
            }
        }

        if (nextChunk.count() > 0) {
            chunks.push(nextChunk);
        }

        return collect(chunks);
    }

    collapse(): CollectionInterface<unknown> {
        return collect<unknown>(this.#items.flat());
    }


    collect(): CollectionInterface<T> {
        return collect(this.#items);
    }

    combine(values: CollectionInterface<JsonValue> | JsonValue[]): Record<string, JsonValue> {
        const combined: Record<string, JsonValue> = {};

        this.#items.forEach((key, index) => {
            if ('string' !== typeof key) {
                throw new TypeError('The `combine` method expects the keys to be strings');
            }

            combined[key] = get(values, index);
        });

        return combined;
    }


    concat(collection: CollectionInterface<unknown> | unknown[]): CollectionInterface<unknown> {
        if (!Array.isArray(collection)) {
            return collect([...this.#items, ...collection.all()]);
        }
        return collect([...this.#items, ...collection]);
    }

    contains(value: T): boolean;
    contains(key: keyof T, value: T): boolean;
    contains(callback: CollectionIteratorCallback<T, boolean>): boolean;
    contains(valueOrKeyOrCallback: T | keyof T | CollectionIteratorCallback<T, boolean>, value?: T): boolean {
        if (typeof valueOrKeyOrCallback === 'function') {
            return this.#items.some((item, index) => {
                return (valueOrKeyOrCallback as CollectionIteratorCallback<T, boolean>)(item, index, this);
            });
        }

        return this.#items.some((item) => {
            if (typeof value === 'undefined') {
                return item == valueOrKeyOrCallback;
            }
            if (typeof valueOrKeyOrCallback !== 'string') {
                throw new TypeError('The key must be a string');
            }

            return item[valueOrKeyOrCallback as keyof T] == value;
        });
    }
    
    containsOneItem(): boolean {
        return this.#items.length === 1;
    }

    containsStrict(value: T): boolean;
    containsStrict(key: keyof T, value: T): boolean;
    containsStrict(callback: CollectionIteratorCallback<T, boolean>): boolean;
    containsStrict(valueOrKeyOrCallback: T | keyof T | (CollectionIteratorCallback<T, boolean>), value?: T): boolean {
        if (typeof valueOrKeyOrCallback === 'function') {
            return this.#items.some((item, index) => {
                return (valueOrKeyOrCallback as CollectionIteratorCallback<T, boolean>)(item, index, this);
            });
        }

        return this.#items.some((item) => {
            if (typeof value === 'undefined') {
                return item === valueOrKeyOrCallback;
            }
            if (typeof valueOrKeyOrCallback !== 'string') {
                throw new TypeError('The key must be a string');
            }

            return item[valueOrKeyOrCallback as keyof T] === value;
        });
    }

    count(): number {
        return this.#items.length;
    }

    countBy(callback?: CollectionIteratorCallback<T, string | number>): Record<string | number, number> {
        if (typeof callback === 'function') {
            return this.#items.reduce((carry, item, index) => {
                const key = callback(item, index, this);
                carry[key] = carry[key] ? carry[key] + 1 : 1;
                return carry;
            }, {} as Record<string, number>);
        }

        return this.#items.reduce((carry, item) => {
            if (!['string', 'number'].includes(typeof item)) {
                throw new TypeError('The countBy method expects the items to be strings or numbers');
            }

            carry[String(item)] = carry[String(item)] ? carry[String(item)] + 1 : 1;
            return carry;
        }, {} as Record<string, number>);
    }

    crossJoin<V>(...collections: (CollectionInterface<V> | V[])[]): CollectionInterface<Array<V | T>> {
        return collect(cartesian<V|T>(
            this.#items,
            ...collections.map((collection) => {
                if (!Array.isArray(collection)) {
                    return collection.all();
                }
                return collection;
            })
        ));
    }
        

    diff(collection: CollectionInterface<T> | T[]): CollectionInterface<T> {
        if (!Array.isArray(collection)) {
            return collect(this.#items.filter(item => !collection.contains(item)));
        }
        return collect(this.#items.filter(item => !collection.includes(item)));
    }

    doesntContain(value: T): boolean;
    doesntContain(key: keyof T, value: T): boolean;
    doesntContain(callback: CollectionIteratorCallback<T, boolean>): boolean;
    doesntContain(valueOrKeyOrCallback: T | keyof T | (CollectionIteratorCallback<T, boolean>), value?: T): boolean {
        if (typeof valueOrKeyOrCallback === 'function') {
            // return !this.items.some(valueOrKeyOrCallback as IteratorCallback<T, boolean>);
            return this.#items.every((item, index) => {
                return !(valueOrKeyOrCallback as CollectionIteratorCallback<T, boolean>)(item, index, this);
            });
        }

        return this.#items.every((item) => {
            if (typeof value === 'undefined') {
                return item != valueOrKeyOrCallback;
            }

            if (typeof valueOrKeyOrCallback !== 'string') {
                throw new TypeError('The key must be a string');
            }

            return item[valueOrKeyOrCallback as keyof T] != value;
        });
    }

    dump(): void {
        console.log(this.toArray());
    }

    duplicates(): CollectionInterface<T>;
    duplicates<K extends keyof T>(key: K): CollectionInterface<T[K]>;
    duplicates<K extends keyof T>(key?: keyof K): CollectionInterface<T> | CollectionInterface<T[K]> {
        if (typeof key === 'string') {
            return collect(this.#items.reduce((carry, item, index) => {
                if (this.#items.slice(index + 1).some((next) => next[key as keyof T] == item[key as keyof T])) {
                    carry.push(item[key as K]);
                }
                return carry;
            }, [] as (T[K])[]));
        }

        return collect(this.#items.reduce((carry, item, index) => {
            if (this.#items.slice(index + 1).some((next) => next == item)) {
                carry.push(item);
            }
            return carry;
        }, [] as T[]));
    }


    duplicatesStrict(): CollectionInterface<T>;
    duplicatesStrict<K extends keyof T>(key: K): CollectionInterface<T[K]>;
    duplicatesStrict<K extends keyof T>(key?: keyof K): CollectionInterface<T> | CollectionInterface<T[K]> {
        if (typeof key === 'string') {
            return collect(this.#items.reduce((carry, item, index) => {
                if (this.#items.slice(index + 1).some((next) => next[key as keyof T] === item[key as keyof T])) {
                    carry.push(item[key as K]);
                }
                return carry;
            }, [] as (T[K])[]));
        }

        return collect(this.#items.reduce((carry, item, index) => {
            if (this.#items.slice(index + 1).some((next) => next === item)) {
                carry.push(item);
            }
            return carry;
        }, [] as T[]));
    }

    each(callback: CollectionIteratorCallback<T, void | false>): this {
        let index = 0;

        for (const item of this) {
            if (false === callback(item, index, this)) {
                break;
            }
            index++;
        }

        return this;
    }

    eachSpread(callback: (...args: unknown[]) => void | false): this {

        for (const item of this) {
            if (!Array.isArray(item) && !isCollection(item)) {
                throw new TypeError('The items in the collection must be arrays or collections');
            }

            const args = Array.isArray(item)
                ? item
                : item.all();
            
            if (false === callback(...args)) {
                break;
            }
        }

        return this;
    }

    ensure(type: TypeOf | Constructor | (TypeOf | Constructor)[]): this {
        const types = Array.isArray(type) ? type : [type];

        this.#items.forEach((item, index) => {
            if (!types.some((type) => {
                if ('string' === typeof type) {
                    return typeof item === type;
                }
                return item instanceof type;
            })) {
                throw new TypeError(`The item at index ${index} is not of the expected type`);
            }
        });

        return this;
    }

    every(callback: CollectionIteratorCallback<T, boolean>): boolean {
        return this.#items.every((item, index) => {
            return callback(item, index, this);
        });
    }

    except(indexes: Array<number>): CollectionInterface<T> {
        return collect(this.#items.filter((_, index) => !indexes.includes(index)));
    }


    filter(callback?: CollectionIteratorCallback<T, boolean>): CollectionInterface<T> {
        return collect(this.#items.filter((item, index) => {
            if (typeof callback !== 'function') {
                return !!item;
            }
            return callback(item, index, this);
        }));
    }


    first(callback?: CollectionIteratorCallback<T, boolean>): T | null {
        if (typeof callback === 'function') {
            return this.#items.find((item, index) => {
                return callback(item, index, this);
            }) ?? null;
        }
        return this.#items[0] ?? null;

    }

    firstOrFail(callback?: CollectionIteratorCallback<T, boolean>): T {
        const item = this.first(callback);
        if (item === null) {
            throw new Error('No matching item found');
        }
        return item;
    }

    firstWhere(key: keyof T): T | null;
    firstWhere(key: keyof T, value: T): T | null;
    firstWhere(key: keyof T, operator: Operator, value: T): T | null;
    firstWhere(key: unknown, operator?: unknown, value?: unknown): T | null {
        if (typeof key !== 'string') {
            throw new TypeError('The key must be a string');
        }

        if (typeof operator === 'undefined') {
            return this.first(item => !!item[key as keyof T]);
        }

        if (typeof value === 'undefined') {
            return this.#items.find(item => item[key as keyof T] == operator) ?? null;
        }

        if (typeof operator !== 'string') {
            throw new TypeError('The operator must be a string');
        }

        if (value === null) {
            return this.#items.find(item => item[key as keyof T] === null) ?? null;
        }

        return this.#items.find(item => {
            switch (operator) {
            case '=':
                return item[key as keyof T] == value;
            case '!=':
                return item[key as keyof T] != value;
            case '>':
                return item[key as keyof T] > value;
            case '<':
                return item[key as keyof T] < value;
            case '>=':
                return item[key as keyof T] >= value;
            case '<=':
                return item[key as keyof T] <= value;
            default:
                throw new Error('Unsupported operator');
            }
        }) ?? null;

    }

    flatMap<R>(callback: CollectionIteratorCallback<T, R | R[]>): CollectionInterface<R> {
        return collect(this.#items.flatMap((item, index) => {
            return callback(item, index, this);
        }));
    }

    forget(key: number): this {
        this.#items.splice(key, 1);
        emitChange(this);
        return this;
    }

    forPage(page: number, perPage: number): CollectionInterface<T> {
        return collect(this.#items.slice((page - 1) * perPage, page * perPage));
    }

    get(key: number): T | null;
    get<R>(key: number, defaultValue: R): T | R;
    get<R>(key: number, defaultValue: () => R): T | R;
    get(key: unknown, defaultValue?: unknown): unknown {
        if (typeof key !== 'number') {
            throw new TypeError('The key must be a number');
        }

        if (typeof defaultValue === 'undefined') {
            return this.#items[key] ?? null;
        }

        if (typeof defaultValue === 'function') {
            return this.#items[key] ?? defaultValue();
        }

        return this.#items[key] ?? defaultValue;
    }

    groupBy(key: keyof T): Record<string, T[]>;
    groupBy(callback: CollectionIteratorCallback<T, string | string[]>): Record<string, T[]>;
    groupBy(keys: (keyof T | CollectionIteratorCallback<T, string | string[]>)[]): Record<string, unknown>;
    groupBy(arg: keyof T | CollectionIteratorCallback<T, string | string[]> | (keyof T | CollectionIteratorCallback<T, string | string[]>)[]): Record<string, unknown> {

        const stack = Array.isArray(arg) ? arg : [arg];

        return this.#items.reduce((carry, item, index) => {
            const segments = stack.map((key) => {
                if (typeof key === 'function') {
                    const result = key(item, index, this);
                    return Array.isArray(result)
                        ? result
                        : [result];
                }
                return [String(item[key])];
            });

            const paths = cartesian(...segments);

            paths.forEach((path) => {
                const key = Array.isArray(path) ? path.join('.') : path;

                _.set(carry, key, [
                    ...(_.get(carry, key, []) as T[]),
                    item,
                ]);
            });

            return carry;
        }, {} as Record<string, unknown>);

    }


    has(index: number): boolean {
        return this.#items.length > index;
    }

    hasAny(indexes: number[]): boolean {
        return indexes.some((index) => this.has(index));
    }

    implode(glue: string): string;
    implode(key: keyof T, glue: string): string;
    implode(callback: CollectionIteratorCallback<T, string>, glue: string): string;
    implode(keyOrGlueOrCallback: string | keyof T | CollectionIteratorCallback<T, string>, glue?: string): string {
        if (typeof glue === 'undefined') {
            if (typeof keyOrGlueOrCallback !== 'string') {
                throw new TypeError('The glue must be a string');
            }

            if (!this.#items.every((item) => ['string', 'number'].includes(typeof item))) {
                throw new TypeError('The items must be strings or numbers');
            }

            return this.#items.join(keyOrGlueOrCallback);
        }
        
        if (typeof keyOrGlueOrCallback === 'function') {
            return this.#items.map((item, index) => {
                return keyOrGlueOrCallback(item, index, this);
            }).join(glue);
        }

        if (typeof keyOrGlueOrCallback !== 'string') {
            throw new TypeError('The key must be a string');
        }

        if (!this.#items.every((item) => typeof item === 'object')) {
            throw new TypeError('The items must be objects');
        }

        return this.#items.map((item) => {
            return item[keyOrGlueOrCallback as keyof T];
        }).join(glue);

    }

    intersect(values: Collection<T> | T[]): CollectionInterface<T> {
        if (!Array.isArray(values)) {
            return collect(this.#items.filter(item => values.contains(item)));
        }
        return collect(this.#items.filter(item => values.includes(item)));
    }

    isEmpty(): boolean {
        return this.#items.length === 0;
    }

    isNotEmpty(): boolean {
        return !this.isEmpty();
    }

    join(glue: string): string;
    join(glue: string, final: string): string;
    join(glue: string, final?: string): string {
        if (typeof final === 'undefined') {
            return this.#items.join(glue);
        }

        return this.#items.slice(0, -1).join(glue) + final + this.#items[this.#items.length - 1];
    }

    keyBy(key: keyof T): Record<string, T>;
    keyBy(callback: CollectionIteratorCallback<T, string>): Record<string, T>;
    keyBy(keyOrCallback: unknown): Record<string, T> {
        if (typeof keyOrCallback === 'function') {
            return this.#items.reduce((carry, item, index) => {
                carry[keyOrCallback(item, index, this)] = item;
                return carry;
            }, {} as Record<string, T>);
        }

        if (typeof keyOrCallback !== 'string') {
            throw new TypeError('The key must be a string');
        }

        return this.#items.reduce((carry, item) => {
            carry[String(item[keyOrCallback as keyof T])] = item;
            return carry;
        }, {} as Record<string, T>);
        
    }

    last(callback?: CollectionIteratorCallback<T, boolean> | undefined): T | null {
        if (typeof callback === 'function') {
            return this.#items.toReversed().find((item, index) => {
                return callback(item, index, this);
            }) ?? null;
        }
        return this.#items[this.#items.length - 1] ?? null;
    }

    map<R>(callback: CollectionIteratorCallback<T, R>): CollectionInterface<R> {
        return collect(this.#items.map((item, index) => callback(item, index, this)));
    }

    mapInto<R extends Constructor<InstanceType<R>>>(constructor: R): CollectionInterface<InstanceType<R>> {
        return collect(this.#items.map((item) => new constructor(item)));
    }

    mapSpread<R>(callback: (...args: unknown[]) => R): CollectionInterface<R> {
        return collect(this.#items.map((item) => {
            if (!Array.isArray(item) && !isCollection(item)) {
                throw new TypeError('The items in the collection must be arrays or collections');
            }

            const args = Array.isArray(item)
                ? item
                : item.all();
            
            return callback(...args);
        }));
        
    }

    mapToGroups<R>(callback: CollectionIteratorCallback<T, Record<string, R>>): Record<string, R[]> {
        return this.#items.reduce((carry, item, index) => {
            const groups = callback(item, index, this);

            Object.entries(groups).forEach(([key, value]) => {
                carry[key] = carry[key] ?? [];
                carry[key].push(value);
            });

            return carry;
        }, {} as Record<string, R[]>);
    }

    mapWithKeys<R>(callback: CollectionIteratorCallback<T, Record<string, R>>): Record<string, R> {
        return this.#items.reduce((carry, item, index) => {
            const keys = callback(item, index, this);

            Object.entries(keys).forEach(([key, value]) => {
                carry[key] = value;
            });

            return carry;
        }, {} as Record<string, R>);
    }

    max(): T | null;
    max<K extends keyof T>(key: K): T[K] | null;
    max<K extends keyof T>(key?: K): T | T[K] | null {
        if (typeof key === 'string') {
            return this.#items.reduce((carry, item) => {
                return item[key] > carry ? item[key] : carry;
            }, this.#items[0][key] as T[K]);
        }

        return this.#items.reduce((carry, item) => {
            return item > carry ? item : carry;
        }, this.#items[0] as T);
    }

    median(): T | null;
    median<K extends keyof T>(key: K): T[K] | null;
    median<K extends keyof T>(key?: K): T | T[K] | null {
        if (typeof key === 'string') {
            const sorted = this.pluck(key).sort();
            const middle = Math.floor(sorted.count() / 2);

            if (sorted.count() % 2 === 0) {
                // return (sorted[middle - 1] + sorted[middle]) / 2;
                return collect([get(sorted, middle - 1), get(sorted, middle)]).avg() as T[K];
            }

            return get(sorted, middle);
        }

        const sorted = this.#items.toSorted();
        const middle = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            // return (sorted[middle - 1] + sorted[middle]) / 2;
            return collect([sorted[middle - 1], sorted[middle]]).avg() as T;
        }

        return sorted[middle] ?? null;
        
    }

    merge(values: CollectionInterface<T> | T[]): CollectionInterface<T>;
    merge<R>(values: CollectionInterface<R> | R[]): CollectionInterface<T | R>;
    merge<R>(values: CollectionInterface<R> | R[]): CollectionInterface<T | R> {
        if (!Array.isArray(values)) {
            return collect([...this.#items, ...values.all()]);
        }
        return collect([...this.#items, ...values]);
    }

    min(): T | null;
    min<K extends keyof T>(key: K): T[K] | null;
    min<K extends keyof T>(key?: K): T | T[K] | null {
        if (typeof key === 'string') {
            return this.#items.reduce((carry, item) => {
                return item[key] < carry ? item[key] : carry;
            }, this.#items[0][key] as T[K]);
        }

        return this.#items.reduce((carry, item) => {
            return item < carry ? item : carry;
        }, this.#items[0] as T);
    }

    mode(): T[];
    mode<K extends keyof T>(key: K): T[K][];
    mode<K extends keyof T>(key?: K): T[] | T[K][] {

        const counts = typeof key === 'string'
            ? this.filter((item) => ['number', 'string'].includes(typeof item[key]))
                .countBy((item) => item[key] as string | number)
            : this.countBy();

        const max = Math.max(...Object.values(counts));

        return Object.entries(counts)
            .filter(([, count]) => count === max)
            .map(([value]) => value) as T[K][];

    }

    nth(n: number, offset: number = 0): CollectionInterface<T> {
        return this.chunk(n)//.get(offset) ?? collect();
            .filter((chunk) => chunk.count() > offset)
            .map((chunk) => chunk.get(offset) as T);
    }

    only(indexes: Array<number>): CollectionInterface<T> {
        return collect(this.#items.filter((_, index) => indexes.includes(index)));
    }

    pad<R>(size: number, value: R | null = null): CollectionInterface<T | R | null> {
        const result: (T|R|null)[] = this.#items.slice();

        while (result.length < Math.abs(size)) {
            if (size > 0) {
                result.push(value);
            } else {
                result.unshift(value);
            }
        }

        return collect(result);
    }

    partition(callback: CollectionIteratorCallback<T, boolean>): [CollectionInterface<T>, CollectionInterface<T>] {
        return [
            this.filter(callback),
            this.reject(callback),
        ];
    }

    percentage(callback: CollectionIteratorCallback<T, boolean>, precision = 2): number {
        return Math.round(
            100 * (10 ^ precision) * this.filter(callback).count()
                / this.#items.length
        ) / (10 ^ precision);
    }

    pipe<R>(callback: CollectionPipeCallback<T, R>): R {
        return callback(this);
    }

    pipeInto<R extends Constructor<InstanceType<R>>>(constructor: R): InstanceType<R> {
        return new constructor(this);
    }

    pipeThrough<R>(pipeline: CollectionPipeCallback<unknown, CollectionInterface<unknown> | R>[]): R {
        // return pipeline.reduce((carry, callback) => callback(carry), this.collect());

        return pipeline.reduce((carry, callback) => {

            if (!isCollection(carry) && !Array.isArray(carry)) {
                throw new TypeError('The pipeline expects the carry to be a collection or an array');
            }

            const result: CollectionInterface<unknown> | R = callback(
                isCollection(carry)
                    ? carry
                    : collect(carry) as Collection<unknown>
            );

            return result;
        }, this as unknown) as R;
    }

    pluck<K extends keyof T>(key: K): CollectionInterface<T[K]> {
        return this.map((item) => item[key]);
    }

    pop(): T | null;
    pop(amount: number): CollectionInterface<T>;
    pop(amount = 1): T | CollectionInterface<T> | null {
        const items = this.#items.splice(this.#items.length - amount, amount);
        emitChange(this);
        return amount === 1 
            ? (items[0] ?? null)
            : collect(items);
    }

    prepend(value: T): number {
        const length = this.#items.unshift(value);
        emitChange(this);

        return length;
    }

    pull(index: number): T | null {
        const item = this.#items.splice(index, 1)[0] ?? null;
        emitChange(this);
        return item;
    }

    push(...items: T[]): number {
        const length = this.#items.push(...items);
        emitChange(this);

        return length;
    }

    put(index: number, value: T): this {
        this.#items.splice(index, 1, value);
        emitChange(this);
        return this;
    }

    random(): T | null;
    random(amount: number): CollectionInterface<T>;
    random(amount = 1): T | CollectionInterface<T> | null {
        if (this.#items.length < amount) {
            throw new Error('The collection has fewer items than the requested amount');
        }
            
        const result = collect(_.sampleSize(this.#items, amount));
        return amount === 1
            ? result.first()
            : result;
    }

    reduce<R>(callback: (carry: R | null, item: T, index: number, collection: this) => R, initialValue: R | null = null): R | null {
        return this.#items.reduce((carry, value, index) => {
            return callback(carry, value, index, this);
        }, initialValue);
    }

    reject(callback: CollectionIteratorCallback<T, boolean>): CollectionInterface<T> {
        return this.filter((item, index) => !callback(item, index, this));
    }

    replace(data: Record<number, T>): CollectionInterface<T> {
        const items = this.#items.slice();

        Object.entries(data).forEach(([index, value]) => {
            items[parseInt(index)] = value;
        });

        return collect(items);
    }

    reverse(): CollectionInterface<T> {
        return collect(this.#items.toReversed());
    }

    search(value: T): number | false;
    search(value: T, strict: boolean): number | false;
    search(callback: CollectionIteratorCallback<T, boolean>): number | false;
    search(valueOrCallback: T | CollectionIteratorCallback<T, boolean>, strict = false): number | false {
        if (typeof valueOrCallback !== 'function' || this.#items.every((item) => typeof item === 'function')) {
            const index = this.#items.findIndex((item) => strict ? item === valueOrCallback : item == valueOrCallback);

            return index === -1 ? false : index;
        }
        const index = this.#items.findIndex((item, index) => {
            return (valueOrCallback as CollectionIteratorCallback<T, boolean>)(item, index, this);
        });

        return index === -1 ? false : index;

    }

    select<K extends Array<keyof T>>(keys: K): CollectionInterface<Pick<T, K[number]>> {
        return this.map((item) => {
            return keys.reduce((carry, key) => {
                carry[key] = item[key];
                return carry;
            }, {} as Pick<T, K[number]>);
        });
    }

    shift(): T | null;
    shift(count: number): CollectionInterface<T>;
    shift(count = 1): T | CollectionInterface<T> | null {
        const items = this.#items.splice(0, count);
        emitChange(this);

        return count === 1
            ? (items[0] ?? null)
            : collect(items);
    }


    shuffle(): CollectionInterface<T> {
        return collect(_.shuffle(this.#items));
    }

    skip(amount: number): CollectionInterface<T> {
        return collect(this.#items.slice(amount));
    }

    skipUntil(callback: CollectionIteratorCallback<T, boolean>): CollectionInterface<T>;
    skipUntil(value: T): CollectionInterface<T>;
    skipUntil(callback: CollectionIteratorCallback<T, boolean> | T): CollectionInterface<T> {

        if (typeof callback === 'function') {
            return this.skip(this.#items.findIndex((item, index) => {
                return (callback as CollectionIteratorCallback<T, boolean>)(item, index, this);
            }));
        }

        return this.skip(this.#items.findIndex((item) => item == callback));
        
    }

    skipWhile(callback: CollectionIteratorCallback<T, boolean>): CollectionInterface<T>;
    skipWhile(value: T): CollectionInterface<T>;
    skipWhile(callback: CollectionIteratorCallback<T, boolean> | T): CollectionInterface<T> {

        if (typeof callback === 'function') {
            return this.skip(this.#items.findIndex((item, index) => {
                return !(callback as CollectionIteratorCallback<T, boolean>)(item, index, this);
            }));
        }

        return this.skip(this.#items.findIndex((item) => item != callback));
        
    }

    slice(start?: number, size?: number): CollectionInterface<T> {
        if (typeof size === 'undefined') {
            return collect(this.#items.slice(start));
        }

        if (typeof start === 'undefined') {
            return collect(this.#items.slice(0, size));
        }

        return collect(this.#items.slice(start, start + size));
    }

    sliding(size: number, step: number = 1): CollectionInterface<CollectionInterface<T>> {
        const chunks = [];
        for (let i = 0; i < this.#items.length; i += step) {
            if (i + size > this.#items.length) {
                break;
            }
            chunks.push(this.#items.slice(i, i + size));
        }

        return collect(chunks.map(chunk => collect(chunk)));
    }

    sole(): T | null;
    sole<K extends keyof T>(key: K, value: T[K]): T | null;
    sole(callback: CollectionIteratorCallback<T, boolean>): T | null;
    sole<K extends keyof T>(keyOrCallback?: K | CollectionIteratorCallback<T, boolean>, value?: T[K]): T | null {
        if (typeof keyOrCallback === 'function') {
            const items = this.filter(keyOrCallback);
            return items.count() === 1 ? items.first() : null;
        }

        if (typeof keyOrCallback === 'string') {
            const items = this.where(keyOrCallback, value as T[K]);
            return items.count() === 1 ? items.first() : null;
        }

        return this.#items.length === 1 ? this.first() : null;
    }

    some(value: T): boolean;
    some(key: keyof T, value: T): boolean;
    some(callback: CollectionIteratorCallback<T, boolean>): boolean;
    some(...args: unknown[]): boolean {
        return this.contains(...args as [keyof T, T]);
    }

    sort(compareFn?: CollectionSortCallback<T>): CollectionInterface<T> {
        return collect(this.#items.toSorted(compareFn));
    }

    sortBy<K extends keyof T>(key: K, order?: 'asc' | 'desc'): CollectionInterface<T>;
    sortBy<K extends keyof T>(columns: [K, 'asc' | 'desc'][]): CollectionInterface<T>;
    sortBy(callback: CollectionIteratorCallback<T, number>): CollectionInterface<T>;
    sortBy(stack: ((a: T, b: T) => number)[]): CollectionInterface<T>;
    sortBy<K extends keyof T>(
        keyOrCallback: K | CollectionIteratorCallback<T, number> | [K, 'asc' | 'desc'][] | ((a: T, b: T) => number)[],
        order: 'asc' | 'desc' = 'asc'
    ): CollectionInterface<T> {
        if (typeof keyOrCallback === 'function') {
            let index = -1;
            return collect(this.#items.toSorted((a, b) => {
                index++;
                return keyOrCallback(a, index, this) - keyOrCallback(b, index, this);
            }));
        }

        if (Array.isArray(keyOrCallback)) {
            if (keyOrCallback.every((criteria) => Array.isArray(criteria))) {
                return collect(this.#items.toSorted((a, b) => {
                    for (const [key, order] of keyOrCallback as [K, 'asc' | 'desc'][]) {
                        const va = a[key] ?? -Infinity;
                        const vb = b[key] ?? -Infinity;

                        if (va > vb) {
                            return order === 'asc' ? 1 : -1;
                        }
                        if (va < vb) {
                            return order === 'asc' ? -1 : 1;
                        }
                    }
                    return 0;
                }));
            }

            return collect(this.#items.toSorted((a, b) => {
                for (const sortFn of keyOrCallback as ((a: T, b: T) => number)[]) {
                    const result = sortFn(a, b);
                    if (result !== 0) {
                        return result;
                    }
                }
                return 0;
            }));
        }

        if (typeof keyOrCallback !== 'string') {
            throw new TypeError('The key must be a string');
        }

        return collect(this.#items.toSorted((a, b) => {
            const va = a[keyOrCallback] ?? -Infinity;
            const vb = b[keyOrCallback] ?? -Infinity;

            return va > vb
                ? order === 'asc' ? 1 : -1
                : (
                    va < vb
                        ? order === 'asc' ? -1 : 1
                        : 0
                );

        }));
    }


    sortDesc(): CollectionInterface<T> {
        return this.sort((a, b) => {
            if (a > b) {
                return -1;
            }
            if (a < b) {
                return 1;
            }
            return 0;
        });
    }

    splice(start: number): CollectionInterface<T>;
    splice(start: number, deleteCount: number): CollectionInterface<T>;
    splice(start: number, deleteCount: number, ...items: T[]): CollectionInterface<T>;
    splice(start: number, deleteCount?: number, ...items: T[]): CollectionInterface<T> {
        const toDelete = deleteCount === undefined 
            ? this.#items.length
            : deleteCount;

        const deleted = this.#items.splice(start, toDelete, ...items);

        emitChange(this);

        return collect<T>(deleted);
    }

    split(groups: number): CollectionInterface<CollectionInterface<T>> {

        const result: CollectionInterface<T>[] = [];
        
        for (let i = 0; i < groups; i++) {
            const chunk = this.#items.slice(
                result.flat().length,
                result.flat().length + Math.min(
                    Math.ceil((this.#items.length - result.flat().length) / (groups - i)),
                    this.#items.length - result.flat().length
                )
            );
            result.push(collect(chunk));
        }

        return collect(result);
    }

    splitIn(groups: number): CollectionInterface<CollectionInterface<T>> {
        const chunkSize = Math.ceil(this.#items.length / groups);

        return this.chunk(chunkSize);
    }


    sum(): number;
    sum<K extends keyof T>(key: K): number;
    sum<K extends keyof T>(key?: K): number {
        if (typeof key === 'string') {
            return this.#items.reduce((carry: number, item) => {
                const value = item[key];
                if (typeof value !== 'number') {
                    throw new TypeError('The items must be numbers');
                }
                return carry + value;
            }, 0);
        }

        return this.#items.reduce((carry: number, item) => {
            if (typeof item !== 'number') {
                throw new TypeError('The items must be numbers');
            }
            return carry + item;
        }, 0);
    }


    take(amount: number): CollectionInterface<T> {
        return collect(this.#items.slice(0, amount));
    }

    takeUntil(value: T): CollectionInterface<T>;
    takeUntil(callback: CollectionIteratorCallback<T, boolean>): CollectionInterface<T>;
    takeUntil(valueOrCallback: T | CollectionIteratorCallback<T, boolean>): CollectionInterface<T> {
        if (typeof valueOrCallback === 'function') {
            return this.take(this.#items.findIndex((item, index) => {
                return (valueOrCallback as CollectionIteratorCallback<T, boolean>)(item, index, this);
            }));
        }

        return this.take(this.#items.findIndex((item) => item == valueOrCallback));
    }

    takeWhile(value: T): CollectionInterface<T>;
    takeWhile(callback: CollectionIteratorCallback<T, boolean>): CollectionInterface<T>;
    takeWhile(valueOrCallback: T | CollectionIteratorCallback<T, boolean>): CollectionInterface<T> {
        if (typeof valueOrCallback === 'function') {
            return this.take(this.#items.findIndex((item, index) => {
                return !(valueOrCallback as CollectionIteratorCallback<T, boolean>)(item, index, this);
            }));
        }

        return this.take(this.#items.findIndex((item) => item != valueOrCallback));
    }

    tap(callback: CollectionPipeCallback<T, void>): this {
        callback(this);
        return this;
    }

    toArray(): T[] {
        const convertImmediateChildrenToArray = (item: unknown): unknown => {
            if (typeof item !== 'object') {
                return item;
            }

            if (Array.isArray(item)) {
                return item.map(convertImmediateChildrenToArray);
            }

            if (item && 'toArray' in item && typeof item.toArray === 'function') {
                return item.toArray();
            }

            if (item && 'toJson' in item && typeof item.toJson === 'function') {
                return item.toJson();
            }

            return item;
        };

        return this.#items.map(convertImmediateChildrenToArray) as T[];
    }

    toJson(): string {
        return JSON.stringify(this.#items);
    }

    transform<R>(callback: CollectionIteratorCallback<T, R>): CollectionInterface<T|R> {
        for (const [index, item] of this.#items.entries()) {
            (this.#items as (T|R)[]).splice(index, 1, callback(item, index, this));
        }

        emitChange(this);
        return this as unknown as CollectionInterface<T|R>;
        
    }

    unique(): CollectionInterface<T>;
    unique<K extends keyof T>(key: K): CollectionInterface<T>;
    unique<K extends keyof T>(key?: K): CollectionInterface<T> {
        if (typeof key === 'string') {
            return collect(this.#items.filter((item, index) => {
                return !this.#items.some((next, nextIndex) => {
                    return next[key] == item[key] && nextIndex !== index;
                });
            }));
        }

        return collect([...new Set(this.#items)]);
    }

    uniqueStrict(): CollectionInterface<T>;
    uniqueStrict<K extends keyof T>(key: K): CollectionInterface<T>;
    uniqueStrict<K extends keyof T>(key?: K): CollectionInterface<T> {
        if (typeof key === 'string') {
            return collect(this.#items.filter((item, index) => {
                return !this.#items.some((next, nextIndex) => {
                    return next[key] === item[key] && nextIndex !== index;
                });
            }));
        }

        return collect([...new Set(this.#items)]);
    }

    unless(condition: boolean, callback: CollectionPipeCallback<T, void>, otherwise?: CollectionPipeCallback<T, void>): this {
        if (!condition) {
            callback(this);
        } else if (typeof otherwise === 'function') {
            otherwise(this);
        }
        return this;
    }

    unlessEmpty(callback: CollectionPipeCallback<T, void>, otherwise?: CollectionPipeCallback<T, void>): this {
        return this.whenNotEmpty(callback, otherwise);
    }

    unlessNotEmpty(callback: CollectionPipeCallback<T, void>, otherwise?: CollectionPipeCallback<T, void>): this {
        return this.whenEmpty(callback, otherwise);
    }

    value<K extends keyof T>(key: K): T[K] | null {
        if (this.#items.length === 0) {
            return null;
        }
        return this.#items[0][key];
    }

    when(condition: boolean, callback: CollectionPipeCallback<T, void>, otherwise?: CollectionPipeCallback<T, void>): this {
        if (condition) {
            callback(this);
        } else if (typeof otherwise === 'function') {
            otherwise(this);
        }
        return this;
    }

    whenEmpty(callback: CollectionPipeCallback<T, void>, otherwise?: CollectionPipeCallback<T, void>): this {
        if (this.isEmpty()) {
            callback(this);
        } else if (typeof otherwise === 'function') {
            otherwise(this);
        }
        return this;
    }

    whenNotEmpty(callback: CollectionPipeCallback<T, void>, otherwise?: CollectionPipeCallback<T, void>): this {
        if (this.isNotEmpty()) {
            callback(this);
        } else if (typeof otherwise === 'function') {
            otherwise(this);
        }
        return this;
    }

    where<K extends keyof T>(key: K, value: T[K]): CollectionInterface<T>;
    where<K extends keyof T>(key: K, operator: Operator, value: T[K]): CollectionInterface<T>;
    where<K extends keyof T>(key: K, operator?: Operator | T[K], value?: T[K]): CollectionInterface<T> {
        if (typeof value === 'undefined') {
            return collect(this.#items.filter((item) => item[key] == operator));
        }

        if (typeof operator !== 'string') {
            throw new TypeError('The operator must be a string');
        }

        if (value === null) {
            return collect(this.#items.filter((item) => item[key] === null));
        }

        const operatorMap: Record<Operator, CollectionIteratorCallback<T, boolean>> = {
            '=': (item) => item[key] == value,
            '!=': (item) => item[key] != value,
            '>': (item) => item[key] > value,
            '<': (item) => item[key] < value,
            '>=': (item) => item[key] >= value,
            '<=': (item) => item[key] <= value,
        };

        if (!(operator in operatorMap)) {
            throw new Error('Unsupported operator');
        }

        return collect(this.#items.filter((value, index) => {
            return operatorMap[operator as Operator](value, index, this);
        }));
    }

    whereStrict<K extends keyof T>(key: K, value: T[K]): CollectionInterface<T>;
    whereStrict<K extends keyof T>(key: K, operator: Operator, value: T[K]): CollectionInterface<T>;
    whereStrict<K extends keyof T>(key: K, operator?: Operator | T[K], value?: T[K]): CollectionInterface<T> {
        if (typeof value === 'undefined') {
            return collect(this.#items.filter((item) => item[key] === operator));
        }

        if (typeof operator !== 'string') {
            throw new TypeError('The operator must be a string');
        }

        if (value === null) {
            return collect(this.#items.filter((item) => item[key] === null));
        }

        const operatorMap: Record<Operator, CollectionIteratorCallback<T, boolean>> = {
            '=': (item) => item[key] === value,
            '!=': (item) => item[key] !== value,
            '>': (item) => item[key] > value,
            '<': (item) => item[key] < value,
            '>=': (item) => item[key] >= value,
            '<=': (item) => item[key] <= value,
        };

        if (!(operator in operatorMap)) {
            throw new Error('Unsupported operator');
        }

        return collect(this.#items.filter((value, index) => {
            return operatorMap[operator as Operator](value, index, this);
        }));
    }

    whereBetween<K extends keyof T>(key: K, [min, max]: [T[K], T[K]]): CollectionInterface<T> {
        return collect(this.#items.filter((item) => item[key] >= min && item[key] <= max));
    }

    whereIn<K extends keyof T>(key: K, values: T[K][]): CollectionInterface<T> {
        return collect(this.#items.filter((item) => values.includes(item[key])));
    }

    whereInstanceOf<R extends Constructor<T>>(constructor: R): CollectionInterface<T> {
        return collect(this.#items.filter((item) => item instanceof constructor));
    }

    whereNotBetween<K extends keyof T>(key: K, [min, max]: [T[K], T[K]]): CollectionInterface<T> {
        return collect(this.#items.filter((item) => item[key] < min || item[key] > max));
    }

    whereNotIn<K extends keyof T>(key: K, values: T[K][]): CollectionInterface<T> {
        return collect(this.#items.filter((item) => !values.includes(item[key])));
    }

    whereNotNull<K extends keyof T>(key: K): CollectionInterface<T> {
        return collect(this.#items.filter((item) => item[key] !== null));
    }

    whereNull<K extends keyof T>(key: K): CollectionInterface<T> {
        return collect(this.#items.filter((item) => item[key] === null));
    }

    zip<R>(items: CollectionInterface<R> | R[]): CollectionInterface<[T, R | null]> {
        if (!Array.isArray(items)) {
            return collect<[T, R | null]>(
                this.#items.map((item, index) => [item, items.get(index)]) as [T, R | null][]
            );
        }

        return collect(
            this.#items.map((item, index) => [item, items[index] ?? null])
        );
    }


    // HasEvents methods
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public on<K extends keyof CollectionEvents<T>>(_: K, __: CollectionEvents<T>[K]): Unsubscribe {
        throw new MethodNotImplementedException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public once<K extends keyof CollectionEvents<T>>(_: K, __: CollectionEvents<T>[K]): void {
        throw new MethodNotImplementedException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public emit<K extends keyof CollectionEvents<T>>(_: K, __?: Omit<Parameters<CollectionEvents<T>[K]>[0], 'source'>): void {
        throw new MethodNotImplementedException();
    }

}


export default HasEvents<CollectionEvents<unknown>, typeof Collection>(Collection);
