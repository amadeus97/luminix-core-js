import { MacroFacade, MacroReducer, Reducer } from '../types/Macro';

export default class Macro implements MacroFacade {
    private reducers: Reducer[] = [];

    add(name: string, callback: MacroReducer, priority: number = 10) {
        this.reducers.push({ name, callback, priority });
    }

    reduce(name: string, value: any, ...args: any[]): any {
        return this.reducers
            .filter((item) => item.name === name)
            .sort((a, b) => a.priority - b.priority)
            .reduce((value, item) => item.callback(value, ...args), value);
    }

    remove(name: string, callback: MacroReducer) {
        this.reducers.splice(this.reducers.findIndex((item) => item.name === name && item.callback === callback), 1);
    }

    get(name?: string): Reducer[] {
        if (name) {
            return this.reducers.filter((item) => item.name === name);
        }
        return this.reducers;
    }

    has(name: string): boolean {
        return this.reducers.some((item) => item.name === name);
    }

    clear(name: string) {
        while (this.has(name)) {
            this.reducers.splice(this.reducers.findIndex((item) => item.name === name), 1);
        }
    }

}


