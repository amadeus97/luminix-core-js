/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { Emitter } from 'nanoevents';
import { EventSourceEvents, EventSource } from '../types/Event';

type Constructor = new (...args: any[]) => {};

export function isEventSource<T>(value: T): value is T & EventSource<any> {
    return typeof value === 'object' 
        && value !== null 
        && 'emit' in value
        && typeof value.emit === 'function'
        && 'on' in value
        && typeof value.on === 'function'
        && 'once' in value
        && typeof value.once === 'function';
}

export function HasEvents<T extends EventSourceEvents, U extends Constructor>(Base: U) {
    return class EventSource extends Base {
    
        #emitter;

        static name = Base.name;

        constructor(...args: any[]) {
            super(...args);
            this.#emitter = this.#createNanoEvents();
        }

        #createNanoEvents(): Emitter<EventSourceEvents> { 
            return {
                emit(event, e) {
                    for (let i = 0, callbacks = this.events[event] || [], length = callbacks.length; i < length;i++) {
                        callbacks[i](e);
                    }
                },
                events: {},
                on(event, cb) {
                    (this.events[event] ||= [] as any[]).push(cb);
                    return () => {
                        this.events[event] = this.events[event]?.filter(i => cb !== i);
                    };
                }
            };
        }

        on<E extends keyof T>(event: E, callback: T[E]) {
            if (typeof event !== 'string') {
                throw new TypeError('event must be a string');
            }
            if (typeof callback !== 'function') {
                throw new TypeError('callback must be a function');
            }
            return this.#emitter.on(event, callback);
        }

        once<E extends keyof T>(event: E, callback: T[E]) {
            if (typeof event !== 'string') {
                throw new TypeError('event must be a string');
            }
            if (typeof callback !== 'function') {
                throw new TypeError('callback must be a function');
            }
            const off = this.#emitter.on(event, (data) => {
                off();
                callback(data);
            });
        }

        emit<E extends keyof T>(event: E, data: Omit<Parameters<T[E]>[0], 'source'> = {} as any) {
            if (typeof event !== 'string') {
                throw new TypeError('event must be a string');
            }
            if (typeof data !== 'object') {
                throw new TypeError('data must be an object');
            }
            this.#emitter.emit(event, {
                ...data,
                source: this,
            });
        }
    };
}

