// import { getProperty, setProperty, hasProperty, deleteProperty } from "dot-prop";
import { produce } from 'immer';
import _ from 'lodash';
import objectPath from 'object-path';

export default class PropertyBag<T extends object = any> {

    private locked: string[] = [];

    constructor(private bag: T) {
        Object.freeze(this.bag);
    }

    get(path: string, defaultValue?: any) {
        // return getProperty(this.bag, path, defaultValue);
        return objectPath.get(this.bag, path, defaultValue);
    }

    set(path: string, value: any) {
        if (this.locked.some((item) => path.startsWith(item))) {
            throw new Error(`Cannot set a locked path "${path}"`);
        }
        if (this.locked.some((item) => item.startsWith(path) 
            && objectPath.has(value, item.slice(path.length))
        )) {
            throw new Error(`Cannot set a path "${path}" that would override a locked path`);
        }
        if (path === 'foo.bar') {
            console.log('set', path, value);
            console.log('locked', this.locked);
            console.log('slice', 'foo.bar.deep.deeper'.slice(path.length));
            console.log('has', objectPath.has(value, 'deep.deeper'));
        }

        this.bag = produce(this.bag, (draft) => {
            objectPath.set(draft, path, value);
        });
    }

    merge(path: string, value: any) {
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
        return objectPath.has(this.bag, path);
    }

    delete(path: string) {
        if (this.locked.some((item) => path.startsWith(item))) {
            throw new Error(`Cannot delete a locked path "${path}"`);
        }
        return objectPath.del(this.bag, path);
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
        return new PropertyBag(_.cloneDeep(this.bag));
    }

    all() {
        return this.bag;
    }
}
