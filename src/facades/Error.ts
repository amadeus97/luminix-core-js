import PropertyBag, { PropertyBagEventMap } from '../contracts/PropertyBag';
import { HasEvents } from '../mixins/HasEvents';
import { ErrorFacade, ValidationError } from '../types/Error';
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

    private bags: Record<string, PropertyBag<Record<string, string>>>;

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

        this.bags = {
            default: new ErrorBag(startBag)
        };
    }


    bag(name = 'default'): PropertyBag<Record<string, string>> {
        if (!this.bags[name]) {
            this.bags[name] = new ErrorBag({});
        }

        return this.bags[name];
    }

    add(key: string, value: string, bag = 'default'): void {
        this.bag(bag).set(key, value);
    }

    set(errors: Record<string, string>, bag = 'default'): void {
        this.bag(bag).set('.', errors);
    }

    all(bag = 'default'): Record<string, string> {
        return this.bag(bag).all();
    }

    get(key: string, bag = 'default'): string | null {
        return this.bag(bag).get(key, null) as string | null;
    }

    clear(bag = 'default'): void {
        this.bag(bag).set('.', {});
    }

}

export default Error;

