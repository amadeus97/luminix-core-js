
export type MacroReducer = (value: any, ...params: any[]) => any;

export interface Reducer {
    // name: string,
    callback: MacroReducer,
    priority: number,
}

export type MacroableInterface = {
    macro(name: string, callback: MacroReducer, priority?: number): () => void;
    applyMacro(name: string, value: any, ...params: any[]): any;
    removeMacro(name: string, callback: MacroReducer): void;
    getMacro(name?: string): Reducer[];
    hasMacro(name: string): boolean;
    clearMacro(name: string): void;
    [macro: string]: (value: any, ...params: any[]) => any;
};