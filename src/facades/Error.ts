import { PropertyBag, Response } from '@luminix/support';

import { ErrorFacade, ValidationError } from '../types/Error';
import reader from '../support/reader';

export const isValidationError = (response: unknown): response is Response<ValidationError> => {
    return response instanceof Response
        && response.unprocessableEntity()
        && typeof response.json('message') === 'string'
        && typeof response.json('errors') === 'object'
        && response.json('errors') !== null
        && Object.values(response.json('errors')).every((value) => Array.isArray(value) && value.every((v) => typeof v === 'string'));
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
            default: new PropertyBag(startBag)
        };
    }


    bag(name = 'default'): PropertyBag<Record<string, string>> {
        if (!this.bags[name]) {
            this.bags[name] = new PropertyBag({});
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

