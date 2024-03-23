/* eslint-disable @typescript-eslint/no-explicit-any */
import { Unsubscribe } from 'nanoevents';

export type Event<S = any> = {
    source: S;
}

export type EventSourceEvents = {
    [event: string]: (e: any) => void;
}


export type EventSource<T extends EventSourceEvents> = {
    on<E extends keyof T>(event: E, callback: T[E]): Unsubscribe;
    once<E extends keyof T>(event: E, callback: T[E]): void;
    emit<E extends keyof T>(event: E, data?: EventData<T, E>): void;
};

export type EventData<T extends EventSourceEvents, E extends keyof T> = Omit<Parameters<T[E]>[0], 'source'>;

