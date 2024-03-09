// import { getProperty, setProperty, hasProperty, deleteProperty } from "dot-prop";
import { produce } from 'immer';
import _ from 'lodash';

export default class PropertyBag<T extends object> {

    private locked: string[] = [];

    constructor(private bag: T) {
        Object.freeze(this.bag);
    }

    get(path: string, defaultValue?: unknown) {
        return _.get(this.bag, path, defaultValue);
    }

    set(path: string, value: unknown) {
        if (this.locked.some((item) => path.startsWith(item))) {
            throw new Error(`Cannot set a locked path "${path}"`);
        }

        if (typeof value === 'object' && value !== null) {
            if (this.locked.some((item) => _.has(value, item.slice(path.length + 1)))) {
                throw new Error(`Cannot set a path "${path}" that would override a locked path`);
            }
        }

        this.bag = produce(this.bag, (draft) => {
            _.set(draft, path, value);
        });
    }

    merge(path: string, value: unknown) {
        if (typeof value !== 'object' || value === null) {
            throw new TypeError('Value must be an object');
        }
        if (path === '.') {
            if (this.locked.some((item) => _.has(value, item))) {
                throw new Error(`Cannot merge a path "${path}" that would override a locked path`);
            }
            this.bag = produce(this.bag, (draft) => {
                return {
                    ...draft,
                    ...value,
                };
            });
            return;
        }
        const currentValue = this.get(path);

        if (typeof currentValue === 'object' && currentValue !== null) {
            return this.set(path, {
                ...currentValue,
                ...value,
            });
        }

        if (currentValue === null || typeof currentValue === 'undefined') {
            return this.set(path, value);
        }

        throw new Error(`Cannot merge a non-object path "${path}"`);
    }

    has(path: string) {
        return _.has(this.bag, path);
    }

    delete(path: string) {
        if (this.locked.some((item) => path.startsWith(item))) {
            throw new Error(`Cannot delete a locked path "${path}"`);
        }
        this.bag = produce(this.bag, (draft) => {
            _.unset(draft, path);
        });
    }

    lock(path: string) {
        if (!this.has(path)) {
            throw new Error(`Cannot lock a non-existing path "${path}"`);
        }
        if (typeof this.get(path) !== 'object') {
            throw new Error(`Cannot lock a non-object path "${path}"`);
        }
        this.locked.push(path);
    }

    clone()
    {
        return new PropertyBag(this.bag);
    }

    all() {
        return this.bag;
    }
}
