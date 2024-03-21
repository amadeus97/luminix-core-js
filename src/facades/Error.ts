import { Unsubscribe } from 'nanoevents';
import PropertyBag, { PropertyBagEventMap } from '../contracts/PropertyBag';
import { HasEvents } from '../mixins/HasEvents';
import { ErrorEventMap, ErrorFacade, ValidationError } from '../types/Error';
import reader from '../support/reader';
import { isAxiosError } from 'axios';

const ErrorBag = HasEvents<PropertyBagEventMap<Record<string, string>>, typeof PropertyBag<Record<string, string>>>(PropertyBag<Record<string, string>>);

export const isValidationError = (error: unknown): error is ValidationError => {
    return isAxiosError(error)
        && error.response !== undefined
        && error.response.data !== null
        && 'message' in error.response.data
        && typeof error.response.data.message === 'string'
        && 'errors' in error.response.data
        && typeof error.response.data.errors === 'object'
        && error.response.data.errors !== null
        && Object.values(error.response.data.errors).every((value) => Array.isArray(value) && value.every((v) => typeof v === 'string'))
        && error.response.status === 422;
};

class Error implements ErrorFacade {

    private bag: PropertyBag<Record<string, string>>;
    private subscriptions: Unsubscribe[] = [];

    constructor()
    {
        const startBag: Record<string, string> = {};
        // find elements in #luminix-embed with id that matches luminix-error*
        // and add them to the error bag
        const elements = document.querySelectorAll('#luminix-embed [id^="luminix-error"]');

        elements.forEach((element) => {
            const id = element.id;
            const key = id.replace('luminix-error::', '');
            startBag[key] = reader(key, 'error');
        });

        this.bag = new ErrorBag(startBag);
        this.setUpEvents();
    }

    private setUpEvents()
    {
        this.subscriptions.forEach((unsubscribe) => {
            unsubscribe();
        });

        this.subscriptions = [];

        this.subscriptions.push(
            this.bag.on('change', (e) => {
                if (e.type === 'delete') {
                    this.emit('change', {
                        key: e.path,
                        value: null,
                    });
                    return;
                }
                this.emit('change', {
                    key: e.path,
                    value: e.value as string,
                });
            })
        );
    }


    add(key: string, value: string): void {
        this.bag.set(key, value);
    }

    set(errors: Record<string, string>): void {
        this.bag = new ErrorBag(errors);
        this.setUpEvents();
        this.emit('change', {
            key: '.',
            value: null,
        });
    }

    all(): Record<string, string> {
        return this.bag.all();
    }

    get(key: string): string | null {
        return this.bag.get(key, null) as string | null;
    }

    clear(): void {
        this.bag = new ErrorBag({});
        this.setUpEvents();
        this.emit('change', {
            key: '.',
            value: null,
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    on<E extends 'change'>(_: E, __: ErrorEventMap[E]): Unsubscribe {
        throw new window.Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    once<E extends 'change'>(_: E, __: ErrorEventMap[E]): void {
        throw new window.Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    emit<E extends 'change'>(_: E, __?: Omit<Parameters<ErrorEventMap[E]>[0], 'source'> | undefined): void {
        throw new window.Error('Method not implemented.');
    }
}

export default HasEvents<ErrorEventMap, typeof Error>(Error);

