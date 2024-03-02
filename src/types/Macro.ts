
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MacroReducer = (value: any, ...params: any[]) => any;

export interface Reducer {
    // name: string,
    callback: MacroReducer,
    priority: number,
}

export type Unsubscribe = () => void;

export type MacroableInterface = {
    macro(name: string, callback: MacroReducer, priority?: number): Unsubscribe;
    removeMacro(name: string, callback: MacroReducer): void;
    getMacro(name: string): Reducer[];
    hasMacro(name: string): boolean;
    clearMacro(name: string): void;
    flushMacros(): void;
    [macro: string]: unknown;
};