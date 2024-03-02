import { MacroReducer, Reducer } from "../types/Macro";

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
          return (value: any, ...args: any[]) => {
            return target.applyMacro(prop, value, ...args);
          };
          // return target.macros[prop];
          // 
        },

      });
    }
  
    macro(name: string, callback: MacroReducer, priority: number = 10) {
        if (!this.macros[name]) {
            this.macros[name] = [];
        }
        this.macros[name] = [
            ...this.macros[name],
            { callback, priority }
        ].sort((a, b) => a.priority - b.priority);

        return () => this.removeMacro(name, callback);
    }

    applyMacro(name: string, value: any, ...args: any[]): any {
        const { [name]: macros = [] } = this.macros;
        return macros.reduce((prevValue, item) => item.callback(prevValue, ...args), value);
    }

    removeMacro(name: string, callback: MacroReducer) {
        const index = this.macros[name].findIndex((item) => item.callback === callback)
        if (index === -1) {
            return;
        }
        this.macros[name].splice(index, 1);
    }

    getMacro(name?: string): Reducer[] {
        if (name) {
            return this.macros[name];
        }
        return Object.values(this.macros).reduce((acc, reducers) => {
            return [
                ...acc,
                ...reducers,
            ];
        }, []);
    }

    hasMacro(name: string): boolean {
        return !!this.macros[name] && this.macros[name].length > 0;
    }

    clearMacro(name: string) {
        this.macros[name] = [];
    }

  };
}

