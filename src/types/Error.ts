import PropertyBag from '../contracts/PropertyBag';
import { Event, EventSource } from './Event';
import { PropertyBagEventMap } from './PropertyBag';

export type ErrorEventMap = {
    change: (e: ErrorChangeEvent) => void;
};

export type ErrorChangeEvent = Event<ErrorFacade> & {
    value: string | null;
    key: string;
};

export type ErrorBag = EventSource<PropertyBagEventMap> & PropertyBag<Record<string, string>>;

export type ErrorFacade = {

    add(key: string, value: string, bag?: string): void;
    set(errors: Record<string, string>, bag?: string): void;
    get(key: string, bag?: string): string | null;
    all(bag?: string): Record<string, string>;
    clear(bag?: string): void;
    bag(name?: string): ErrorBag;
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
