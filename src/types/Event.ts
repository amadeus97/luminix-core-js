/* eslint-disable @typescript-eslint/no-explicit-any */

export type Event<S = any> = {
    source: S;
}

export type EventSourceEvents = {
    [event: string]: (e: any) => void;
}


export type EventSource<T extends EventSourceEvents> = {
    on<E extends keyof T>(event: E, callback: T[E]): void;
    once<E extends keyof T>(event: E, callback: T[E]): void;
    emit<E extends keyof T>(event: E, data?: Omit<Parameters<T[E]>[0], 'source'>): void;
};



