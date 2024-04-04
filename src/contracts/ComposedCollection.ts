import { Unsubscribe } from 'nanoevents';
import { HasEvents } from '../mixins/HasEvents';
import { CollectionEvents , Operator, Collection as CollectionInterface, CollectionIteratorCallback } from '../types/Collection';

import MethodNotImplementedException from '../exceptions/MethodNotImplementedException';
import { JsonValue } from '../types/Model';
import { Constructor, TypeOf } from '../types/Support';
import _ from 'lodash';
import { cartesian } from '../support/collection';

export function isCollection(instance: unknown): instance is Collection<unknown> {
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

export function collect<T = unknown>(items: T[] = []): Collection<T> {
    if (!Array.isArray(items)) {
        throw new TypeError('collect() expects an array');
    }

    return new (HasEvents<CollectionEvents<T>, typeof Collection>(Collection))(items);
}


class Collection<T> implements CollectionInterface<T> {

    static name = 'Collection';

    constructor(
        protected items: Array<T> = []
    ) {
        return new Proxy(this, {
            get(target, prop, receiver) {
                if (typeof prop === 'number') {
                    return Reflect.get(target.items, prop, receiver);
                }
                return Reflect.get(target, prop, receiver);
            }
        });
    }

    [Symbol.iterator]() {
        return this.items[Symbol.iterator]();
    }

    private emitChange() {
        this.emit('change', {
            items: [...this.items],
        });
    }


    all(): T[] {
        return [...this.items];
    }

    average(): number
    average(key: keyof T): number
    average(key?: keyof T): number {
        if (typeof key === 'string') {
            return this.avg(key);
        }
        return this.avg();
    }

    avg(): number
    avg(key: keyof T): number
    avg(key?: keyof T): number {
        
        if (typeof key === 'string') {
            return this.sum(key) / this.items.length;
        }

        return this.sum() / this.items.length;
    }

    chunk(size: number): Collection<Collection<T>> {
        const chunks = [];
        for (let i = 0; i < this.items.length; i += size) {
            chunks.push(this.items.slice(i, i + size));
        }

        return collect(chunks.map(chunk => collect(chunk)));
    }

    chunkWhile(callback: CollectionIteratorCallback<T, boolean>): Collection<Collection<T>> {
        const chunks = [];
        let nextChunk: Collection<T> = collect();
        for (let i = 0; i < this.items.length; i++) {
            if (callback(this.items[i], i, nextChunk)) {
                nextChunk.push(this.items[i]);
            } else {
                chunks.push(nextChunk);
                nextChunk = collect();
            }
        }

        if (nextChunk.count() > 0) {
            chunks.push(nextChunk);
        }

        return collect(chunks);
    }

    collapse(): Collection<unknown> {
        return collect(this.items.flat());
    }


    collect(): Collection<T> {
        return collect(this.items);
    }

    combine(values: Collection<JsonValue> | JsonValue[]): Record<string, JsonValue> {
        const combined: Record<string, JsonValue> = {};

        this.items.forEach((key, index) => {
            if ('string' !== typeof key) {
                throw new TypeError('The `combine` method expects the keys to be strings');
            }

            combined[key] = values[index];
        });

        return combined;
    }


    concat(collection: Collection<T> | T[]): Collection<T> {
        if (isCollection(collection)) {
            return collect([...this.items, ...collection.all()]);
        }
        return collect([...this.items, ...collection]);
    }

    contains(value: T): boolean;
    contains(key: keyof T, value: T): boolean;
    contains(callback: CollectionIteratorCallback<T, boolean>): boolean;
    contains(valueOrKeyOrCallback: T | keyof T | CollectionIteratorCallback<T, boolean>, value?: T): boolean {
        if (typeof valueOrKeyOrCallback === 'function') {
            return this.items.some((item, index) => {
                return (valueOrKeyOrCallback as CollectionIteratorCallback<T, boolean>)(item, index, this);
            });
        }

        return this.items.some((item) => {
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
        return this.count() === 1;
    }

    containsStrict(value: T): boolean;
    containsStrict(key: keyof T, value: T): boolean;
    containsStrict(callback: CollectionIteratorCallback<T, boolean>): boolean;
    containsStrict(valueOrKeyOrCallback: T | keyof T | (CollectionIteratorCallback<T, boolean>), value?: T): boolean {
        if (typeof valueOrKeyOrCallback === 'function') {
            return this.items.some((item, index) => {
                return (valueOrKeyOrCallback as CollectionIteratorCallback<T, boolean>)(item, index, this);
            });
        }

        return this.items.some((item) => {
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
        return this.items.length;
    }

    countBy(): Record<string, number>;
    countBy(callback: CollectionIteratorCallback<T, string>): Record<string, number>;
    countBy(callback?: CollectionIteratorCallback<T, string>): Record<string, number> {
        if (typeof callback === 'function') {
            return this.items.reduce((carry, item, index) => {
                const key = callback(item, index, this);
                carry[key] = carry[key] ? carry[key] + 1 : 1;
                return carry;
            }, {} as Record<string, number>);
        }

        return this.items.reduce((carry, item) => {
            if (!['string', 'number'].includes(typeof item)) {
                throw new TypeError('The countBy method expects the items to be strings or numbers');
            }

            carry[String(item)] = carry[String(item)] ? carry[String(item)] + 1 : 1;
            return carry;
        }, {} as Record<string, number>);
    }

    crossJoin<V>(...collections: (Collection<V> | V[])[]): Collection<Array<V | T>> {
        return collect(cartesian<V|T>(this.items, ...collections.map((collection) => {
            if (isCollection(collection)) {
                return collection.all();
            }
            return collection;
        })));
    }
        

    diff(collection: Collection<T> | T[]): Collection<T> {
        if (isCollection(collection)) {
            return collect(this.items.filter(item => !collection.contains(item)));
        }
        return collect(this.items.filter(item => !collection.includes(item)));
    }

    doesntContain(value: T): boolean;
    doesntContain(key: keyof T, value: T): boolean;
    doesntContain(callback: CollectionIteratorCallback<T, boolean>): boolean;
    doesntContain(valueOrKeyOrCallback: T | keyof T | (CollectionIteratorCallback<T, boolean>), value?: T): boolean {
        if (typeof valueOrKeyOrCallback === 'function') {
            // return !this.items.some(valueOrKeyOrCallback as IteratorCallback<T, boolean>);
            return this.items.every((item, index) => {
                return !(valueOrKeyOrCallback as CollectionIteratorCallback<T, boolean>)(item, index, this);
            });
        }

        return this.items.every((item) => {
            if (typeof value === 'undefined') {
                return item != valueOrKeyOrCallback;
            }

            if (typeof valueOrKeyOrCallback !== 'string') {
                throw new TypeError('The key must be a string');
            }

            return item[valueOrKeyOrCallback as keyof T] != value;
        });
    }

    duplicates(): Collection<T>;
    duplicates<K extends keyof T>(key: K): Collection<T[K]>;
    duplicates<K extends keyof T>(key?: keyof K): Collection<T> | Collection<T[K]> {
        if (typeof key === 'string') {
            return collect(this.items.reduce((carry, item, index) => {
                if (this.items.slice(index + 1).some((next) => next[key as keyof T] == item[key as keyof T])) {
                    carry.push(item[key as K]);
                }
                return carry;
            }, [] as (T[K])[]));
        }

        return collect(this.items.reduce((carry, item, index) => {
            if (this.items.slice(index + 1).some((next) => next == item)) {
                carry.push(item);
            }
            return carry;
        }, [] as T[]));
    }


    duplicatesStrict(): Collection<T>;
    duplicatesStrict<K extends keyof T>(key: K): Collection<T[K]>;
    duplicatesStrict<K extends keyof T>(key?: keyof K): Collection<T> | Collection<T[K]> {
        if (typeof key === 'string') {
            return collect(this.items.reduce((carry, item, index) => {
                if (this.items.slice(index + 1).some((next) => next[key as keyof T] === item[key as keyof T])) {
                    carry.push(item[key as K]);
                }
                return carry;
            }, [] as (T[K])[]));
        }

        return collect(this.items.reduce((carry, item, index) => {
            if (this.items.slice(index + 1).some((next) => next === item)) {
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

        this.items.forEach((item, index) => {
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
        return this.items.every((item, index) => {
            return callback(item, index, this);
        });
    }

    except(indexes: Array<number>): Collection<T> {
        return collect(this.items.filter((_, index) => !indexes.includes(index)));
    }


    filter(callback?: CollectionIteratorCallback<T, boolean>): Collection<T> {
        return collect(this.items.filter((item, index) => {
            if (typeof callback !== 'function') {
                return !!item;
            }
            return callback(item, index, this);
        }));
    }


    first(callback?: CollectionIteratorCallback<T, boolean>): T | null {
        if (typeof callback === 'function') {
            return this.items.find((item, index) => {
                return callback(item, index, this);
            }) ?? null;
        }
        return this.items[0] ?? null;

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
            return this.items.find(item => item[key as keyof T] == operator) ?? null;
        }

        if (typeof operator !== 'string') {
            throw new TypeError('The operator must be a string');
        }

        if (value === null) {
            return this.items.find(item => item[key as keyof T] === null) ?? null;
        }

        return this.items.find(item => {
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

    flatMap<R>(callback: CollectionIteratorCallback<T, R | R[]>): Collection<R> {
        return collect(this.items.flatMap((item, index) => {
            return callback(item, index, this);
        }));
    }

    forget(key: number): this {
        this.items.splice(key, 1);
        this.emitChange();
        return this;
    }

    forPage(page: number, perPage: number): Collection<T> {
        return collect(this.items.slice((page - 1) * perPage, page * perPage));
    }

    get(key: number): T | null;
    get<R>(key: number, defaultValue: R): T | R;
    get<R>(key: number, defaultValue: () => R): T | R;
    get(key: unknown, defaultValue?: unknown): unknown {
        if (typeof key !== 'number') {
            throw new TypeError('The key must be a number');
        }

        if (typeof defaultValue === 'undefined') {
            return this.items[key] ?? null;
        }

        if (typeof defaultValue === 'function') {
            return this.items[key] ?? defaultValue();
        }

        return this.items[key] ?? defaultValue;
    }

    groupBy(key: keyof T): Record<string, T[]>;
    groupBy(callback: CollectionIteratorCallback<T, string | string[]>): Record<string, T[]>;
    groupBy(keys: (keyof T | CollectionIteratorCallback<T, string | string[]>)[]): Record<string, unknown>;
    groupBy(arg: keyof T | CollectionIteratorCallback<T, string | string[]> | (keyof T | CollectionIteratorCallback<T, string | string[]>)[]): Record<string, unknown> {

        const stack = Array.isArray(arg) ? arg : [arg];

        return this.items.reduce((carry, item, index) => {
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
                const key = path.join('.');

                _.set(carry, key, [
                    ...(_.get(carry, key, []) as T[]),
                    item,
                ]);
            });

            return carry;
        }, {} as Record<string, unknown>);

    }



    // methods that mutates the collection
    fill(value: T, start: number = 0, end: number = this.items.length): this {
        this.items.fill(value, start, end);

        this.emit('change', {
            items: this.items,
        });

        return this;
    }

    push(...items: T[]): this {
        this.items.push(...items);

        this.emit('change', {
            items: this.items,
        });

        return this;
    }

    pop(): T | undefined {
        const item = this.items.pop();

        this.emit('change', {
            items: this.items,
        });

        return item;
    }

    shift(): T | undefined {
        const item = this.items.shift();

        this.emit('change', {
            items: this.items,
        });

        return item;
    }

    unshift(...items: T[]): this {
        this.items.unshift(...items);

        this.emit('change', {
            items: this.items,
        });

        return this;
    }

    splice(start: number): Collection<T>;
    splice(start: number, deleteCount: number): Collection<T>;
    splice(start: number, deleteCount: number, ...items: T[]): Collection<T>;
    splice(start: number, deleteCount?: number, ...items: T[]): Collection<T> {
        const toDelete = deleteCount === undefined 
            ? this.items.length
            : deleteCount;

        const deleted = this.items.splice(start, toDelete, ...items);

        this.emit('change', {
            items: this.items,
        });

        return collect<T>(deleted);
    }


    copyWithin(target: number, start: number, end?: number ): this {
        this.items.copyWithin(target, start, end);

        this.emit('change', {
            items: this.items,
        });

        return this;
    }


    // methods that returns a new collection

    reverse(): Collection<T> {
        return collect(this.items.toReversed());
    }

    sort(compareFn?: (a: T, b: T) => number): Collection<T> {
        return collect(this.items.toSorted(compareFn));
    }


    map<U>(callback: (value: T, index: number, array: T[]) => U): Collection<U> {
        return collect(this.items.map(callback));
    }


    reduce<U>(callback: (accumulator: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U {
        return this.items.reduce(callback, initialValue);
    }



    // Eloquent methods

    range(start: number, end: number): Collection<T> {
        return collect(this.items.slice(start, end));
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

    [index: number]: T;
}


export default HasEvents<CollectionEvents<unknown>, typeof Collection>(Collection);
