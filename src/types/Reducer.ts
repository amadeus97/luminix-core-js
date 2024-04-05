import { Collection } from './Collection';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReducerCallback = (value: any, ...params: any[]) => any;

export interface Reducer {
    callback: ReducerCallback,
    priority: number,
}

export type Unsubscribe = () => void;

export type ReducibleInterface = {
    reducer(name: string, callback: ReducerCallback, priority?: number): Unsubscribe;
    removeReducer(name: string, callback: ReducerCallback): void;
    getReducer(name: string): Collection<Reducer>;
    hasReducer(name: string): boolean;
    clearReducer(name: string): void;
    flushReducers(): void;
    [reducer: string]: unknown;
};