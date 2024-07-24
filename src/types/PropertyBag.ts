import { Unsubscribe } from 'nanoevents';
import { Event } from './Event';


export type PropertyBagChangeEvent<T extends object> = Event<PropertyBag<T>> & {
    path: string;
    value: unknown;
    type: 'set' | 'merge' | 'delete';
};

export type PropertyBagEventMap<T extends object = any> = {// eslint-disable-line @typescript-eslint/no-explicit-any
    'change': (e: PropertyBagChangeEvent<T>) => void; 
};


export type PropertyBag<T extends object> = {

    // new(value?: T): T;

    get(path: string, defaultValue?: unknown): unknown;
    set(path: string, value: unknown): void;
    merge(path: string, value: unknown): void;
    has(path: string): boolean;
    delete(path: string): void;
    lock(path: string): void;
    clone(): PropertyBag<T>;
    all(): T;
    isEmpty(): boolean;
    on<K extends keyof PropertyBagEventMap<T>>(event: K, callback: PropertyBagEventMap<T>[K]): Unsubscribe;
    once<K extends keyof PropertyBagEventMap<T>>(event: K, callback: PropertyBagEventMap<T>[K]): void;
    emit<K extends keyof PropertyBagEventMap<T>>(event: K, payload: Omit<Parameters<PropertyBagEventMap<T>[K]>[0], 'source'>): void;

    
};

