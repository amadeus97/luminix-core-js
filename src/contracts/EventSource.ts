import { createNanoEvents } from "nanoevents";

export type Event<S = any> = {
    source: S;
}

export type EventSourceEvents = {
    [event: string]: (e: any) => void;
}

export default class EventSource<T extends EventSourceEvents = EventSourceEvents>
{
    private emitter;

    constructor() {
        this.emitter = createNanoEvents();
    }

    on<E extends keyof T>(event: E, callback: T[E]) {
        if (typeof event !== 'string') {
            throw new TypeError('event must be a string');
        }
        if (typeof callback !== 'function') {
            throw new TypeError('callback must be a function');
        }
        return this.emitter.on(event, callback);
    }

    once<E extends keyof T>(event: E, callback: T[E]) {
        if (typeof event !== 'string') {
            throw new TypeError('event must be a string');
        }
        if (typeof callback !== 'function') {
            throw new TypeError('callback must be a function');
        }
        const off = this.emitter.on(event, (data) => {
            off();
            callback(data);
        });
    }

    emit<E extends keyof T>(event: E, data: Omit<Parameters<T[E]>[0], "source"> = {} as any) {
        if (typeof event !== 'string') {
            throw new TypeError('event must be a string');
        }
        if (typeof data !== 'object') {
            throw new TypeError('data must be an object');
        }
        this.emitter.emit(event, {
            ...data,
            source: this,
        });
    }
}

