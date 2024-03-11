import app from './helpers/app';
import auth from './helpers/auth';
import config from './helpers/config';
import error from './helpers/error';
import log from './helpers/log';
import model from './helpers/model';
import route from './helpers/route';

import { isValidationError } from './facades/Error';

import Plugin from './contracts/Plugin';
import PropertyBag from './contracts/PropertyBag';
import { Reducible } from './mixins/Reducible';
import { HasEvents } from './mixins/HasEvents';

export {
    app,
    auth,
    config,
    error,
    log,
    model,
    route,

    isValidationError,

    Plugin,
    PropertyBag,
    Reducible,
    HasEvents,
};

// types
export type { AppFacade } from './types/App';
export type { AuthFacade } from './types/Auth';
export type { LogFacade } from './types/Log';
export type { RepositoryFacade } from './types/Model';
export type { ReducibleInterface } from './types/Reducer';
export type { RouteFacade } from './types/Route';
export type { Model, BaseModel } from './types/Model';
export type { EventSource } from './types/Event';
