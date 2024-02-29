
export type MacroReducer = (value: any, ...params: any[]) => any;

export interface Reducer {
    // name: string,
    callback: MacroReducer,
    priority: number,
}

export type MacroFacade = {
    add(name: string, callback: MacroReducer, priority?: number): void;
    remove(name: string, callback: MacroReducer): void;
    get(name?: string): Reducer[];
    has(name: string): boolean;
    clear(name: string): void;
    reduce(name: string, value: any, ...params: any[]): any;
};

