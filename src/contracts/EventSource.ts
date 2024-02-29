import { createNanoEvents } from "nanoevents";

export type Event<S = any> = {
    source: S;
}

export type EventSourceEvents = {
    [event: string]: (e: any) => void;
}

export default class EventSource<T extends EventSourceEvents = any>
{
    private emitter;

    constructor() {
        this.emitter = createNanoEvents();
    }

    on<E extends keyof T>(event: E, callback: T[E]) {
        if (typeof event === 'symbol') {
            throw new TypeError('event cannot be a Symbol');
        }
        return this.emitter.on(event, callback);
    }

    emit<E extends keyof T>(event: E, data: Omit<Parameters<T[E]>[0], "source"> = {} as any) {
        if (typeof event === 'symbol') {
            throw new TypeError('event cannot be a Symbol');
        }
        this.emitter.emit(event, {
            ...data,
            source: this,
        });
    }
}

