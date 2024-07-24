// import { getProperty, setProperty, hasProperty, deleteProperty } from "dot-prop";
import { produce } from 'immer';
import _ from 'lodash';
import { PropertyBag as PropertyBagInterface, PropertyBagEventMap } from '../types/PropertyBag';
import { Unsubscribe } from 'nanoevents';



class PropertyBag<T extends object> implements PropertyBagInterface<T> {

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

        if (path === '.') {
            if (this.locked.length) {
                throw new Error('Cannot set the root path when there are locked paths');
            }

            if (typeof value !== 'object' || value === null) {
                throw new TypeError('Value must be an object');
            }

            this.bag = produce(this.bag, () => value);
            this.emit('change', {
                path,
                value,
                type: 'set',
            });
            return;
        }

        this.bag = produce(this.bag, (draft) => {
            _.set(draft, path, value);
        });

        this.emit('change', {
            path,
            value,
            type: 'set',
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
            this.emit('change', {
                path,
                value,
                type: 'merge',
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

        this.emit('change', {
            path,
            value: null,
            type: 'delete',
        });
    }

    lock(path: string) {
        if (!this.has(path)) {
            throw new Error(`Cannot lock a non-existing path "${path}"`);
        }
        this.locked.push(path);
    }

    clone(): PropertyBagInterface<T>
    {
        return new PropertyBag(this.bag);
    }

    all() {
        return this.bag;
    }

    isEmpty() {
        return _.isEmpty(this.bag);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    on<K extends keyof PropertyBagEventMap<T>>(_: K, __: PropertyBagEventMap[K]): Unsubscribe {
        return () => null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    once<K extends keyof PropertyBagEventMap<T>>(_: K, __: PropertyBagEventMap[K]) {
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    emit<K extends keyof PropertyBagEventMap<T>>(_: K, __: Omit<Parameters<PropertyBagEventMap[K]>[0], 'source'>) {
    }
}


export default PropertyBag;
