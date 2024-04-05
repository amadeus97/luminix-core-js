import app from './helpers/app';
import auth from './helpers/auth';
import collect from './helpers/collect';
import config from './helpers/config';
import error from './helpers/error';
import log from './helpers/log';
import model from './helpers/model';
import route from './helpers/route';

import { isValidationError } from './facades/Error';

import Plugin from './contracts/Plugin';
import PropertyBag from './contracts/PropertyBag';

import { isModel } from './support/model';

import { Reducible } from './mixins/Reducible';
import { HasEvents } from './mixins/HasEvents';

// eslint-disable-next-line @typescript-eslint/no-explicit-any


export {
    app,
    auth,
    collect,
    config,
    error,
    log,
    model,
    route,

    isValidationError,
    isModel,

    Plugin,
    PropertyBag,
    Reducible,
    HasEvents,
};

// types
export type { AppFacade } from './types/App';
export type { AuthFacade } from './types/Auth';
export type { LogFacade } from './types/Log';
export type { ReducibleInterface } from './types/Reducer';
export type { RouteFacade } from './types/Route';
export type { Model, BaseModel } from './types/Model';
export type { EventSource } from './types/Event';
