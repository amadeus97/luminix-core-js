
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReducerCallback = (value: any, ...params: any[]) => any;

export interface Reducer {
    // name: string,
    callback: ReducerCallback,
    priority: number,
}

export type Unsubscribe = () => void;

export type ReduceableInterface = {
    reducer(name: string, callback: ReducerCallback, priority?: number): Unsubscribe;
    removeReducer(name: string, callback: ReducerCallback): void;
    getReducer(name: string): Reducer[];
    hasReducer(name: string): boolean;
    clearReducer(name: string): void;
    flushReducers(): void;
    [reducer: string]: unknown;
};