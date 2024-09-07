import { HasFacadeAccessor, MakeFacade, Response } from '@luminix/support';

import { ValidationError } from '../types/Error';
import ErrorService from '../services/ErrorService';
import App from './App';

export const isValidationError = (response: unknown): response is Response<ValidationError> => {
    return response instanceof Response
        && response.unprocessableEntity()
        && typeof response.json('message') === 'string'
        && typeof response.json('errors') === 'object'
        && response.json('errors') !== null
        && Object.values(response.json('errors')).every((value) => Array.isArray(value) && value.every((v) => typeof v === 'string'));
};

class ErrorFacade implements HasFacadeAccessor
{
    getFacadeAccessor(): string | object {
        return 'error';    
    }
}

const Error = MakeFacade<ErrorService, ErrorFacade>(ErrorFacade, App);


export default Error;
