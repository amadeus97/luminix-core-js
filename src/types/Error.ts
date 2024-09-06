import { PropertyBag } from '@luminix/support';

export type ErrorBag = PropertyBag<Record<string, string>>;

export type ErrorFacade = {
    add(key: string, value: string, bag?: string): void;
    set(errors: Record<string, string>, bag?: string): void;
    get(key: string, bag?: string): string | null;
    all(bag?: string): Record<string, string>;
    clear(bag?: string): void;
    bag(name?: string): ErrorBag;
};

export type ValidationError = {
    message: string;
    errors: {
        [key: string]: string[];
    };
};
