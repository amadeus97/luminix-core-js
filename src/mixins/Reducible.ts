/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { isDraftable, produce } from 'immer';
import { ReducerCallback, Reducer } from '../types/Reducer';


import { collect } from '../contracts/Collection';

import ReducerOverrideException from '../exceptions/ReducerOverrideException';

import { Constructor } from '../types/Support';

import { Collection } from '../types/Collection';


export function Reducible<T extends Constructor>(Base: T) {
    return class extends Base {
        reducers: {
            [name: string]: Collection<Reducer> // Reducer[]
        } = {};

        constructor(...args: any[]) {
            super(...args);
            return new Proxy(this, {
                get(target, prop, receiver) {
                    if (typeof prop === 'symbol' || prop in target) {
                        return Reflect.get(target, prop, receiver);
                    }
                    return (value: unknown, ...args: unknown[]) => {
                        const { [prop]: macros = [] } = target.reducers;

                        if (isDraftable(value)) {
                            return produce(value, (draft: unknown) => {
                                return macros.reduce((prevValue, item) => item.callback(prevValue, ...args), draft);
                            });
                        }
    
                        return macros.reduce((prevValue, item) => item.callback(prevValue, ...args), value);
                    };
                },

            });
        }
  
        reducer(name: string, callback: ReducerCallback, priority: number = 10) {
            if (name in this) {
                throw new ReducerOverrideException(name, this);
            }
            if (!this.reducers[name]) {
                this.reducers[name] = collect<Reducer>();
            }

            this.reducers[name].push({ callback, priority });
            this.reducers[name].sort((a, b) => a.priority - b.priority);

            return () => this.removeReducer(name, callback);
        }

        removeReducer(name: string, callback: ReducerCallback) {
            const index = this.reducers[name].search(callback);
            if (index === false) {
                return;
            }
            this.reducers[name].pull(index);
        }

        getReducer(name: string): Collection<Reducer> {
            return this.reducers[name];
        }

        hasReducer(name: string): boolean {
            return !!this.reducers[name] && this.reducers[name].count() > 0;
        }

        clearReducer(name: string) {
            this.reducers[name].splice(0, this.reducers[name].count());
        }

        flushReducers() {
            Object.values(this.reducers).forEach((collection) => collection.splice(0, collection.count()));
        }
    };
}

