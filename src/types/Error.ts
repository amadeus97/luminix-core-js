import { Event, EventSource } from './Event';

export type ErrorEventMap = {
    change: (e: ErrorChangeEvent) => void;
};

export type ErrorChangeEvent = Event<ErrorFacade> & {
    value: string | null;
    key: string;
};

export type ErrorFacade = EventSource<ErrorEventMap> & {

    add(key: string, value: string): void;
    set(errors: Record<string, string>): void;
    get(key: string): string | null;
    all(): Record<string, string>;
    clear(): void;
};

export type ValidationError = Error & {
    response: {
        status: 422;
        data: {
            message: string;
            errors: {
                [key: string]: string[];
            };
        };
    }
}
