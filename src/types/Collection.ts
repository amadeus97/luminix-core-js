// import { Collection } from '../contracts/Collection';
import { Event, EventSource } from './Event';
import { JsonValue } from './Model';
import { Constructor, TypeOf } from './Support';

export type CollectionEvents<T = unknown> = {
    'change': (e: CollectionChangeEvent<T>) => void,
}


export type CollectionChangeEvent<T = unknown> = Event<Collection<T>> & {
    items: T[];
}

export type Operator = '=' | '!=' | '>' | '>=' | '<' | '<=';




export type CollectionIteratorCallback<T = unknown, R = void> = (value: T, index: number, collection: Collection<T>) => R;

export type Collection<T = unknown> = EventSource<CollectionEvents<T>> & {

    [Symbol.iterator](): Iterator<T>;

    [index: number]: T;


    /**
     *
     * The `all` method returns the underlying array represented by the collection.
     * 
     * 
     */
    all(): T[];


    /**
     *
     * Alias for the `avg` method.
     *
     */
    average(): number;
    average<K extends keyof T>(key: K): T[K] extends number ? number : never;
    
    
    /**
     * The `avg` method returns the average value of a given key.
     * 
     * ```js
     * collect([1, 2, 3, 4, 5]).avg();
     * // 3
     * collect([{ value: 1 }, { value: 2 }, { value: 3 }]).avg('value');
     * // 2
     * ```
     *
     */
    avg(): number;
    avg<K extends keyof T>(key: K): T[K] extends number ? number : never;


    /**
     * 
     * The `chunk` method breaks the collection into multiple, smaller collections of a given size:
     * 
     * ```js
     * collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).chunk(3);
     * // [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]
     * ```
     * 
     * This method is especially useful in views when working with a grid system such as Bootstrap.
     * For example, imagine you have a collection of Luminix models that you want to display in a grid, using React:
     * 
     * ```jsx
     * <div className="container">
     *    {products.chunk(3).map((chunk, rowIndex) => (
     *        <div key={rowIndex} className="row">
     *            {chunk.map((product, colIndex) => (
     *                <div key={colIndex} className="col">
     *                   {product.name}
     *                </div>
     *            ))}
     *        </div>
     *     ))}
     * </div>
     * ```
     *
     */
    chunk(size: number): Collection<Collection<T>>;


    /**
     * 
     * The `chunkWhile` method breaks the collection into multiple, smaller collections based
     * on the evaluation of the given callback. The `chunk`variable passed to the closure may
     * be used to inspect the previous elements in the current chunk:
     * 
     * ```js
     * const collection = collect('AABBCCCCD'.split(''));
     * const chunks = collection.chunkWhile((value, index, chunk) => {
     *    return value === chunk.last();
     * });
     * 
     * chunks.all();
     * // [['A', 'A'], ['B', 'B'], ['C', 'C', 'C'], ['D']]
     * ```
     *
     */
    chunkWhile(callback: CollectionIteratorCallback<T, boolean>): Collection<Collection<T>>;


    /**
     * 
     * The `collapse` method collapses a collection of arrays into a single, flat collection:
     * 
     * ```js
     * collect([[1, 2, 3], [4, 5, 6], [7, 8, 9]]).collapse();
     * // [1, 2, 3, 4, 5, 6, 7, 8, 9]
     * ```
     *
     */
    collapse(): Collection<unknown>;

    /**
     * 
     * The `collect` method creates a new `Collection` instance with the items
     * currently in the collection:
     *
     */
    collect(): Collection<T>;


    /**
     * The `combine` method combines the values of the collection, as keys,
     * with the values of another array or collection:
     * 
     * ```js
     * collect(['name', 'age']).combine(['George', 29]);
     * // { name: 'George', age: 29 }
     * ```
     * 
     */
    combine(values: Collection<JsonValue> | JsonValue[]): Record<string, JsonValue>;


    /**
     * The `concat` method appends the given array or collection's values
     * onto the end of another collection:
     * 
     * ```js
     * collect([1, 2, 3]).concat([4, 5, 6]);
     * // [1, 2, 3, 4, 5, 6]
     * ```
     * 
     * The `concat` method will not modify the original collection:
     * 
     */
    concat(values: Collection<T> | T[]): Collection<T>;


    /**
     * The `contains` method determines whether the collection contains a given item.
     * You may pass a closure to the `contains` method to determine if an element
     * exists in the collection matching a given truth test:
     * 
     * ```js
     * collect([1, 2, 3, 4, 5]).contains(3);
     * // true
     * 
     * collect([1, 2, 3, 4, 5]).contains(value => value > 5);
     * // false
     * ```
     * 
     * You may also pass a key / value pair to the `contains` method, which will determine
     * if the given pair exists in the collection:
     * 
     * ```js
     * const collection = collect([
     *     { name: 'Desk', price: 200 },
     *     { name: 'Chair', price: 100 },
     * ]);
     * 
     * collection.contains('name', 'Desk');
     * // true
     * ```
     * 
     * The `contains` method uses "loose" comparisons when checking values, meaning a string
     * with an integer value will be considered equal to an integer with the same numeric value.
     * Use the `containsStrict` method to filter using strict comparisons.
     * 
     * For the inverse of the `contains` method, see the `doesntContain` method.
     * 
     */
    contains(value: T): boolean;
    contains(key: keyof T, value: T): boolean;
    contains(callback: CollectionIteratorCallback<T, boolean>): boolean;


    /**
     *
     * The `containsOneItem` method determnines whether the collection contains
     * a single item:
     *
     */
    containsOneItem(): boolean;



    /**
     * 
     * This method has the same signature as the `contains` method; however
     * all values are compared using strict comparisons.
     * 
     */
    containsStrict(value: T): boolean;
    containsStrict(key: keyof T, value: T): boolean;
    containsStrict(callback: CollectionIteratorCallback<T, boolean>): boolean;

    /**
     * 
     * The `count` method returns the total number of items in the collection:
     * 
     * ```js
     * collect([1, 2, 3, 4]).count();
     * // 4
     * ```
     * 
     */
    count(): number;


    /**
     *
     * The `countBy` method counts the occurrences of values in the collection.
     * By default, the method counts the occurrences of every element, allowing
     * you to count certain "types" of elements in the collection:
     * 
     * ```js
     * const collection = collect([1, 2, 2, 2, 3]);
     * 
     * const counted = collection.countBy();
     * 
     * // { 1: 1, 2: 3, 3: 1 } 
     * ```
     * 
     * You may also pass a callback to the `countBy` method to count all items by
     * a custom value:
     * 
     * ```js
     * const collection = collect(['alice@gmail.com', 'bob@yahoo.com', 'carlos@gmail.com']);
     * 
     * const counted = collection.countBy((value) => value.split('@')[1]);
     * 
     * // { 'gmail.com': 2, 'yahoo.com': 1 }
     * ```
     *
     */
    countBy(callback?: CollectionIteratorCallback<T, string | number>): Record<string | number, number>;


    /**
     *
     * The `crossJoin` method cross joins the collection's values among the given arrays or collections,
     * returning a Cartesian product with all possible permutations:
     * 
     * ```js
     * collect([1, 2]).crossJoin(['a', 'b']);
     * 
     * // [
     * //   [1, 'a'],
     * //   [1, 'b'],
     * //   [2, 'a'],
     * //   [2, 'b'],
     * // ]
     * 
     * collect([1, 2]).crossJoin(['a', 'b'], ['I', 'II']);
     * 
     * // [
     * //   [1, 'a', 'I'],
     * //   [1, 'a', 'II'],
     * //   [1, 'b', 'I'],
     * //   [1, 'b', 'II'],
     * //   [2, 'a', 'I'],
     * //   [2, 'a', 'II'],
     * //   [2, 'b', 'I'],
     * //   [2, 'b', 'II'],
     * // ]
     * 
     * ```
     * 
     */
    crossJoin<V>(...collections: (Collection<V> | V[])[]): Collection<(T | V)[]>;

    /**
     *
     * The `diff` method compares the collection against another collection or a plain array
     * based on its values. This method will return the values in the original collection that
     * are not present in the given collection:
     * 
     * ```js
     * collect([1, 2, 3, 4, 5]).diff([2, 4, 6, 8]);
     * // [1, 3, 5]
     * ```
     *
     */
    diff(values: Collection<T> | T[]): Collection<T>;


    /**
     * 
     * The `doesntContain` method determines whether the collection does not contain a given item.
     * You may pass a closure to the `doesntContain` method to determine if an element
     * does not exist in the collection matching a given truth test:
     * 
     * ```js
     * collect([1, 2, 3, 4, 5]).doesntContain(3);
     * // false
     * 
     * collect([1, 2, 3, 4, 5]).doesntContain(value => value > 5);
     * // true
     * 
     * ```
     * 
     * You may also pass a key / value pair to the `doesntContain` method, which will determine
     * if the given pair does not exist in the collection:
     * 
     * ```js
     * const collection = collect([
     *    { name: 'Desk', price: 200 },
     *    { name: 'Chair', price: 100 },
     * ]);
     * 
     * collection.doesntContain('name', 'Desk');
     * // false
     * 
     * collection.doesntContain('name', 'Bookcase');
     * // true
     * ```
     * 
     * The `doesntContain` method uses "loose" comparisons when checking values, meaning a string
     * with an integer value will be considered equal to an integer with the same numeric value.
     * 
     */
    doesntContain(value: T): boolean;
    doesntContain(key: keyof T, value: T): boolean;
    doesntContain(callback: CollectionIteratorCallback<T, boolean>): boolean;


    /**
     * 
     * The `duplicates` method retrieves and returns duplicate values from the collection:
     * 
     * ```js
     * collect([1, 2, 2, 3, 4, 4, 5]).duplicates();
     * // [2, 4]
     * ```
     * 
     * If the collection contains objects, you may pass a key of the attributes
     * that you wish to check for duplicate values:
     * 
     * ```js
     * const employees = collect([ 
     *    { id: 1, name: 'John Doe', position: 'Developer' },
     *    { id: 2, name: 'Jane Doe', position: 'Designer' },
     *    { id: 3, name: 'Johnny Doe', position: 'Developer' },
     * ]);
     * 
     * employees.duplicates('position');
     * // ['Developer']
     * 
     * ```
     * 
     * The `duplicates` method uses "loose" comparisons when checking values, meaning a string
     * with an integer value will be considered equal to an integer with the same numeric value.
     * 
     */
    duplicates(): Collection<T>;
    duplicates<K extends keyof T>(key: K): Collection<T[K]>;


    /**
     * 
     * The `duplicatesStrict` method has the same signature as the `duplicates` method;
     * however, all values are compared using strict comparisons.
     * 
     */
    duplicatesStrict(): Collection<T>;
    duplicatesStrict<K extends keyof T>(key: K): Collection<T[K]>;


    /**
     * 
     * The `each` method iterates over the items in the collection and passes each item to a callback:
     * 
     * ```js
     * collect([1, 2, 3]).each((value, index) => {
     *    console.log(value, index);
     * });
     * ```
     * 
     * If you would like to stop iterating through the items, you may return `false` from the callback:
     * 
     * ```js
     * collect([1, 2, 3]).each((value, index) => {
     *    console.log(value, index);
     *    if (value === 2) {
     *        return false;
     *    }
     * });
     * // 1, 0, 2, 1
     * ```
     * 
     */
    each(callback: CollectionIteratorCallback<T, void | false>): Collection<T>;


    /**
     * 
     * The `eachSpread` method iterates over the items in the collection,
     * passing each nested item to a callback:
     * 
     * ```js
     * collect([
     *   ['John Doe', 36],
     *   ['Jane Doe', 34],
     * ]).eachSpread((name, age) => {
     *   // ...
     * });
     * ```
     * 
     * You may stop iterating through the items by returning `false` from the callback:
     * 
     * ```js
     * collection.eachSpread((name, age) => {
     *   return false;
     * });
     * ```
     * 
     */
    eachSpread(callback: (...args: unknown[]) => void | false): Collection<T>;


    /**
     * 
     * The `ensure` method may be used to verify that all elements of
     * a collection are of a given type or list of types. Otherwise
     * an error will be thrown:
     * 
     * ```js
     * return collection.ensure(User);
     * 
     * return collection.ensure([User, Customer]);
     * ```
     * 
     * Primitive types may also be passed to the `ensure` method:
     * 
     * ```js
     * return collection.ensure('string');
     * ```
     * 
     */
    ensure(type: TypeOf | Constructor | (TypeOf | Constructor)[]): Collection<T>;


    /**
     * 
     * The `every` method may be used to verify that all elements of
     * a collection pass a given truth test:
     * 
     * ```js
     * collect([1, 2, 3, 4, 5]).every((value, index) => value > 2);
     * // false
     * ```
     * 
     * If the collection is empty, the `every` method will return `true`.
     * 
     */
    every(callback: CollectionIteratorCallback<T, boolean>): boolean;



    /**
     * 
     * The `except` method returns all items in the collection except for those
     * with the specified indexes:
     * 
     * ```js
     * collect([1, 2, 3, 4, 5]).except([0, 4]);
     * // [2, 3, 4]
     * ```
     * 
     * For the inverse of `except`, see the `only` method.
     * 
     */
    except(indexes: number[]): Collection<T>;




    /**
     * 
     * The `filter` method filters the collection using the given callback, keeping only those items that pass a given truth test:
     * 
     * ```js
     * collect([1, 2, 3, 4, 5]).filter(value => value > 2);
     * 
     * // [3, 4, 5]
     * ```
     * 
     * If no callback is provided, all values that are equivalent to `false` will be removed:
     * 
     * ```js
     * collect([1, 2, 3, null, false, '', 0, 4, 5]).filter();
     * // [1, 2, 3, 4, 5]
     * ```
     * 
     * For the inverse of `filter`, see the `reject` method.
     * 
     */
    filter(callback?: CollectionIteratorCallback<T, boolean>): Collection<T>;


    /**
     * 
     * The `first` method returns the first item in the collection that passes a given truth test:
     * 
     * ```js
     * collect([1, 2, 3, 4, 5]).first(value => value > 2);
     * // 3
     * ```
     * 
     * If no callback is provided, the first item in the collection will be returned:
     * 
     * ```js
     * collect([1, 2, 3, 4, 5]).first();
     * // 1
     * ```
     * 
     * If the collection is empty, or if no items pass the truth test, `null` will be returned.
     * 
     */
    first(callback?: CollectionIteratorCallback<T, boolean>): T | null;


    /**
     * 
     * The `firstOrFail` is identical to the `first` method, except that it will throw
     * an error if no matching item is found:
     * 
     * ```js
     * collect([1, 2, 3, 4]).firstOrFail(value => value > 5);
     * // Error: No matching item found
     * ```
     * 
     * If no callback is provided, the `firstOrFail` method will return the first item
     * in the collection. If the collection is empty, an error will be thrown:
     * 
     * ```js
     * collect().firstOrFail();
     * // Error: No matching item found
     * ```
     * 
     */
    firstOrFail(callback?: CollectionIteratorCallback<T, boolean>): T;


    /**
     * 
     * The `firstWhere` method returns the first item in the collection with the given key / value pair:
     * 
     * ```js
     * const collection = collect([
     *    { name: 'Janie Doe', age: null },
     *    { name: 'John Doe', age: 36 },
     *    { name: 'Jane Doe', age: 34 },
     *    { name: 'Johnny Doe', age: 86 },
     * ]);
     * 
     * collection.firstWhere('age', 36);
     * // { name: 'John Doe', age: 36 }
     * ```
     * 
     * You may also call the `firstWhere` method with a comparison operator:
     * 
     * ```js
     * collection.firstWhere('age', '>', 35);
     * // { name: 'John Doe', age: 36 }
     * ```
     * 
     * Like the `where` method, you may pass one argument to the `firstWhere` method.
     * In this scenario, the `firstWhere` method will return the first item where the
     * given item key's value is "truthy":
     * 
     * ```js
     * collection.firstWhere('age');
     * // { name: 'John Doe', age: 36 }
     * ```
     * 
     */
    firstWhere(key: keyof T): T | null;
    firstWhere(key: keyof T, value: T): T | null;
    firstWhere(key: keyof T, operator: Operator, value: T): T | null;

    /**
     * 
     * Calls a defined callback function on each element of the collection. Then,
     * flattens the result into a new collection. This is identical to a map followed
     * by flat with depth 1:
     * 
     * ```js
     * const collection = collect([1, 2, 5]);
     * 
     * collection.flatMap((num) => (num === 2 ? [num, num * 2] : 1));
     * // [1, 2, 4, 1]
     * ```
     * 
     */
    flatMap<R>(callback: CollectionIteratorCallback<T, R | R[]>): Collection<R>;

    /**
     * 
     * The `forget` method removes an item from the collection by its key:
     * 
     * ```js
     * const collection = collect([1, 2, 3, 4]);
     * 
     * collection.forget(1);
     * 
     * collection.all();
     * // [1, 3, 4]
     * 
     * ```
     * 
     * Unlike most other collection methods, `forget` does not return a new collection;
     * it modifies the collection it is called on.
     * 
     */
    forget(key: number): Collection<T>;

    /**
     * 
     * The `forPage` method returns a new collection containing the items that would be present
     * on a given page number. The method accepts the page number as its first argument and the
     * number of items to show per page as its second argument:
     * 
     * ```js
     * collect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
     *     .forPage(2, 3)
     *     .all();
     * // [4, 5, 6]
     * ```
     * 
     */
    forPage(page: number, perPage: number): Collection<T>;

    /**
     * 
     * The `get` method returns the item at a given key. If the key does not exist,
     * `null` will be returned:
     * 
     * ```js
     * collect([1, 2, 3, 4]).get(2);
     * // 3
     * ```
     * 
     * You may also pass a default value as the second argument:
     * 
     * ```js
     * collect([1, 2, 3, 4]).get(5, 'default');
     * // 'default'
     * ```
     * 
     * You may even pass a callback as the default value. The result of the callback
     * will be returned if the key does not exist:
     * 
     * ```js
     * collect([1, 2, 3, 4]).get(5, () => 'default');
     * // 'default'
     * ```
     * 
     */
    get(key: number): T | null;
    get<R>(key: number, defaultValue: R): T | R;
    get<R>(key: number, defaultValue: () => R): T | R;

    /**
     * 
     * The `groupBy` method groups the collection's items by a given key:
     * 
     * ```js
     * const collection = collect([
     *    { account_id: 'account-x10', product: 'Chair' },
     *    { account_id: 'account-x10', product: 'Bookcase' },
     *    { account_id: 'account-x11', product: 'Desk' },
     * ]);
     * 
     * collection.groupBy('account_id');
     * // {
     * //    'account-x10': [
     * //        { account_id: 'account-x10', product: 'Chair' },
     * //        { account_id: 'account-x10', product: 'Bookcase' },
     * //    ],
     * //    'account-x11': [
     * //        { account_id: 'account-x11', product: 'Desk' },
     * //    ],
     * // }
     * ```
     * 
     * The `groupBy` method also accepts a callback. The callback should return the value
     * to group the collection by:
     * 
     * ```js
     * collection.groupBy((item) => item.account_id.slice(-3));
     * // {
     * //    'x10': [
     * //        { account_id: 'account-x10', product: 'Chair' },
     * //        { account_id: 'account-x10', product: 'Bookcase' },
     * //    ],
     * //    'x11': [
     * //        { account_id: 'account-x11', product: 'Desk' },
     * //    ],
     * // }
     * ```
     * 
     * Multiple grouping criteria may be passed as an array:
     * 
     * ```js
     * const data = collect([
     *     { user: 1, skill: 1, roles: ['Member', 'Author'] },
     *     { user: 2, skill: 1, roles: ['Member', 'Manager'] },
     *     { user: 3, skill: 2, roles: ['Member'] },
     *     { user: 4, skill: 2, roles: ['Manager'] },
     * ]);
     * 
     * data.groupBy(['skill', (item) => item.roles]);
     * // {
     * //    '1': {
     * //        'Member': [
     * //            { user: 1, skill: 1, roles: ['Member', 'Author'] },
     * //            { user: 2, skill: 1, roles: ['Member', 'Manager'] },
     * //        ],
     * //        'Author': [
     * //            { user: 1, skill: 1, roles: ['Member', 'Author'] },
     * //        ],
     * //        'Manager': [
     * //            { user: 2, skill: 1, roles: ['Member', 'Manager'] },
     * //        ],
     * //    },
     * //    '2': {
     * //        'Member': [
     * //            { user: 3, skill: 2, roles: ['Member'] },
     * //        ],
     * //        'Manager': [
     * //            { user: 4, skill: 2, roles: ['Manager'] },
     * //        ],
     * //    },
     * // }
     * ```
     * 
     */
    groupBy(key: keyof T): Record<string, T[]>;
    groupBy(callback: CollectionIteratorCallback<T, string | string[]>): Record<string, T[]>;
    groupBy(keys: (keyof T | CollectionIteratorCallback<T, string | string[]>)[]): Record<string, unknown>;


    /**
     * 
     * The `has` method determines if a index exists in the collection:
     * 
     * ```js
     * collect([1, 2, 3, 4]).has(2);
     * // true
     * ```
     * 
     */
    has(index: number): boolean;

    /**
     * 
     * The `hasAny` method determines if any of the given indexes exist in the collection:
     * 
     * ```js
     * collect([1, 2, 3, 4]).hasAny([2, 4, 6]);
     * // true
     * ```
     * 
     */
    hasAny(indexes: number[]): boolean;

    /**
     * 
     * The `implode` method joins the items in a collection. Its arguments depend on the type
     * of items in the collection. If the collection contains objects, you should pass the key
     * of the attributes you wish to join, and the "glue" string you wish to place between the
     * values:
     *
     * ```js
     * const collection = collect([
     *     { account_id: 1, product: 'Desk' },
     *     { account_id: 2, product: 'Chair' }, 
     * ]).implode('product', ', ');
     * // 'Desk, Chair'
     * ```
     * 
     * If the collection contains simple strings or numeric values, simply pass the "glue" as
     * the only argument:
     * 
     * ```js
     * collect([1, 2, 3, 4, 5]).implode('-');
     * // '1-2-3-4-5'
     * ```
     * 
     * You may pass a callback to the `implode` method if you would like to format the values
     * being imploded:
     * 
     * ```js
     * collection.implode((item) => item.product.toUpperCase(), ', ');
     * // 'DESK, CHAIR'
     * ```
     * 
     */
    implode(glue: string): string;
    implode(key: keyof T, glue: string): string;
    implode(callback: CollectionIteratorCallback<T, string>, glue: string): string;


    /**
     * 
     * The `intersect` method compares the collection against another collection or a plain array
     * based on its values, keeping only the values that are present in both collections:
     * 
     * ```js
     * collect([1, 2, 3, 4, 5]).intersect([2, 4, 6, 8]).all();
     * // [2, 4]
     * ```
     * 
     * > This method behavior is modified when using a ModelCollection.
     * 
     */
    intersect(values: Collection<T> | T[]): Collection<T>;

    /**
     * 
     * The `isEmpty` method returns `true` if the collection is empty; otherwise, `false` is returned:
     * 
     * ```js
     * collect().isEmpty();
     * // true
     * ```
     * 
     */
    isEmpty(): boolean;

    /**
     * 
     * The `isNotEmpty` method returns `true` if the collection is not empty; otherwise, `false` is returned:
     * 
     * ```js
     * collect().isNotEmpty();
     * // false
     * ```
     * 
     */
    isNotEmpty(): boolean;

    /**
     * 
     * The `join` method joins the collection's values with a string. Using this
     * method's second argument, you may also specify how the final element should
     * be appended to the string:
     * 
     * ```js
     * collect(['a', 'b', 'c']).join(', '); // 'a, b, c'
     * collect(['a', 'b', 'c']).join(', ', ' and '); // 'a, b and c'
     * ```
     * 
     */
    join(glue: string): string;
    join(glue: string, finalGlue: string): string;


    /**
     * 
     * The `keyBy` method keys the collection by the given key. If multiple items have the same key,
     * only the last one will appear in the new collection:
     * 
     * ```js
     * const collection = collect([
     *    { product_id: 'prod-100', name: 'Desk' },
     *    { product_id: 'prod-200', name: 'Chair' },
     * ]);
     * 
     * collection.keyBy('product_id');
     * // {
     * //    'prod-100': { product_id: 'prod-100', name: 'Desk' },
     * //    'prod-200': { product_id: 'prod-200', name: 'Chair' },
     * // }
     * ```
     * 
     * You may also pass a callback to the method. The callback should return the value to key
     * the collection by:
     * 
     * ```js
     * collection.keyBy((item) => item.product_id.toUpperCase());
     * // {
     * //    'PROD-100': { product_id: 'prod-100', name: 'Desk' },
     * //    'PROD-200': { product_id: 'prod-200', name: 'Chair' },
     * // }
     * ```
     * 
     */
    keyBy(key: keyof T): Record<string, T>;
    keyBy(callback: CollectionIteratorCallback<T, string>): Record<string, T>;

    /**
     * 
     * The `last` method returns the last item in the collection that passes a given truth test:
     * 
     * ```js
     * collect([1, 2, 3, 4, 5]).last(value => value < 3);
     * // 2
     * ```
     * 
     * If no callback is provided, the last item in the collection will be returned:
     * 
     * ```js
     * collect([1, 2, 3, 4, 5]).last();
     * // 5
     * ```
     * 
     */
    last(callback?: CollectionIteratorCallback<T, boolean>): T | null;

    /**
     * 
     * The `map` method iterates through the collection and passes each value to
     * the given callback. The callback is free to modify the item and return it,
     * thus forming a new collection of modified items:
     * 
     * ```js
     * collect([1, 2, 3, 4, 5]).map(value => value * 2).all();
     * // [2, 4, 6, 8, 10]
     * 
     */
    map<R>(callback: CollectionIteratorCallback<T, R>): Collection<R>;

    /**
     * 
     * The `mapInto` method creates a new collection by passing each item in the collection
     * to a given constructor:
     * 
     * ```js
     * class User {
     * 
     *   constructor(attributes) {
     *     this.attributes = attributes;
     *   }
     * }
     * 
     * const collection = collect([{ name: 'John' }, { name: 'Jane' }]);
     * 
     * collection.mapInto(User).all();
     * // [User, User]
     * ```
     * 
     */
    mapInto<R extends Constructor<InstanceType<R>>>(constructor: R): Collection<InstanceType<R>>;

    /**
     * 
     * The `mapSpread` method iterates through the collection and passes each nested item to
     * the given callback. The callback is free to modify the item and return it, thus forming
     * a new collection of modified items:
     * 
     * ```js
     * const collection = collect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
     * 
     * collection.chunk(2).mapSpread((even, odd) => even + odd).all();
     * // [1, 5, 9, 13, 17]
     * ```
     * 
     */
    mapSpread<R>(callback: (...args: unknown[]) => R): Collection<R>;

    /**
     * 
     * The `mapToGroups` method groups the collection's items by a given callback.
     * The callback should return an object containing the a single key / value pair,
     * thus forming a new object of grouped values:
     * 
     * ```js
     * const collection = collect([
     *     { name: 'John Doe', department: 'Sales' },
     *     { name: 'Jane Doe', department: 'Sales' },
     *     { name: 'Johnny Doe', department: 'Marketing' },
     * ]);
     * 
     * collection.mapToGroups((item) => ({ [item.department]: item.name }));
     * // {
     * //    'Sales': ['John Doe', 'Jane Doe'],
     * //    'Marketing': ['Johnny Doe'],
     * // }
     * ```
     * 
     */
    mapToGroups<R>(callback: CollectionIteratorCallback<T, Record<string, R>>): Record<string, R[]>;

    /**
     * 
     * The `mapWithKeys` method iterates through the collection and passes each value to the given callback.
     * The callback should return an object containing a single key / value pair:
     * 
     * ```js
     * const collection = collect([
     *     { product_id: 'prod-100', name: 'Desk' },
     *     { product_id: 'prod-200', name: 'Chair' },
     * ]);
     * 
     * collection.mapWithKeys((item) => ({ [item.product_id]: item.name }));
     * // {
     * //    'prod-100': 'Desk',
     * //    'prod-200': 'Chair',
     * // }
     * ```
     * 
     */
    mapWithKeys<R>(callback: CollectionIteratorCallback<T, Record<string, R>>): Record<string, R>;

    /**
     * 
     * The `max` method returns the maximum value of a given key:
     * 
     * ```js
     * const collection = collect([{ foo: 10 }, { foo: 20 }]);
     * 
     * collection.max('foo');
     * // 20
     * 
     * collect([1, 2, 3, 4, 5]).max();
     * // 5
     * 
     * ```
     *
     * If the collection is empty, `null` will be returned.
     * 
     */
    max(): T | null;
    max<K extends keyof T>(key: K): T[K] | null;

    /**
     * 
     * The `median` method returns the median value of a given key:
     * 
     * ```js
     * const collection = collect([1, 2, 2, 4]);
     * 
     * collection.median();
     * // 2
     * ```
     * 
     * If the collection is empty, `null` will be returned.
     * 
     */
    median(): T | null;
    median<K extends keyof T>(key: K): T[K] | null;

    /**
     * 
     * The `merge` method creates a new collection by merging the items
     * of the collection with the items of another array or collection:
     * 
     * ```js
     * collect([1, 2, 3]).merge([4, 5, 6]);
     * // [1, 2, 3, 4, 5, 6]
     * ```
     * 
     */
    merge(values: Collection<T> | T[]): Collection<T>;
    merge<R>(values: Collection<R> | R[]): Collection<T | R>;

    /**
     * 
     * The `min` method returns the minimum value of a given key:
     * 
     * ```js
     * let min = collect([{ foo: 10 }, { foo: 20 }]).min('foo');
     * // 10
     * 
     * min = collect([1, 2, 3, 4, 5]).min();
     * // 1
     * 
     */
    min(): T | null;
    min<K extends keyof T>(key: K): T[K] | null;

    /**
     * 
     * The `mode` method returns the mode value of a given key:
     * 
     * ```js
     * let mode = collect([
     *     { foo: 10 },
     *     { foo: 10 },
     *     { foo: 20 },
     *     { foo: 40 },
     * ]).mode('foo');
     * // [10]
     * 
     * mode = collect([1, 2, 2, 4]).mode();
     * // [2]
     * 
     * mode = collect([1, 1, 2, 2]).mode();
     * // [1, 2]
     * 
     * ```
     * 
     * @link https://en.wikipedia.org/wiki/Mode_(statistics)
     * 
     */
    mode(): T[];
    mode<K extends keyof T>(key: K): T[K][];

};



