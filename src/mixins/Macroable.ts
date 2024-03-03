/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { isDraftable, produce } from 'immer';
import { MacroReducer, Reducer } from '../types/Macro';

type Constructor = new (...args: any[]) => {};

export function Macroable<T extends Constructor>(Base: T) {
    return class extends Base {
        macros: {
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
                        const { [prop]: macros = [] } = target.macros;

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
  
        macro(name: string, callback: MacroReducer, priority: number = 10) {
            if (name in this) {
                throw new Error(`Cannot create macro '${name}' on '${this}' as it is a reserved property`);
            }
            if (!this.macros[name]) {
                this.macros[name] = [];
            }
            this.macros[name] = [
                ...this.macros[name],
                { callback, priority }
            ].sort((a, b) => a.priority - b.priority);

            return () => this.removeMacro(name, callback);
        }

        removeMacro(name: string, callback: MacroReducer) {
            const index = this.macros[name].findIndex((item) => item.callback === callback);
            if (index === -1) {
                return;
            }
            this.macros[name].splice(index, 1);
        }

        getMacro(name: string): Reducer[] {
            return this.macros[name];
        }

        hasMacro(name: string): boolean {
            return !!this.macros[name] && this.macros[name].length > 0;
        }

        clearMacro(name: string) {
            this.macros[name] = [];
        }

        flushMacros() {
            this.macros = {};
        }
    };
}

