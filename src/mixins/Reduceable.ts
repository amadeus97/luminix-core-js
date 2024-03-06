/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { isDraftable, produce } from 'immer';
import { ReducerCallback, Reducer } from '../types/Reducer';

type Constructor = new (...args: any[]) => {};

export function Reduceable<T extends Constructor>(Base: T) {
    return class extends Base {
        reducers: {
            [name: string]: Reducer[]
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
                throw new Error(`Cannot create reducer '${name}' on '${this}' as it is a reserved property`);
            }
            if (!this.reducers[name]) {
                this.reducers[name] = [];
            }
            this.reducers[name] = [
                ...this.reducers[name],
                { callback, priority }
            ].sort((a, b) => a.priority - b.priority);

            return () => this.removeReducer(name, callback);
        }

        removeReducer(name: string, callback: ReducerCallback) {
            const index = this.reducers[name].findIndex((item) => item.callback === callback);
            if (index === -1) {
                return;
            }
            this.reducers[name].splice(index, 1);
        }

        getReducer(name: string): Reducer[] {
            return this.reducers[name];
        }

        hasReducer(name: string): boolean {
            return !!this.reducers[name] && this.reducers[name].length > 0;
        }

        clearReducer(name: string) {
            this.reducers[name] = [];
        }

        flushReducers() {
            this.reducers = {};
        }
    };
}

