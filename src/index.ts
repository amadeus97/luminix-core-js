import app from './helpers/app';
import auth from './helpers/auth';
import collect from './helpers/collect';
import config from './helpers/config';
import error from './helpers/error';
import log from './helpers/log';
import model from './helpers/model';
import route from './helpers/route';

import App from './facades/App';
import { isValidationError } from './facades/Error';

import Plugin from './contracts/Plugin';

import { isModel } from './support/model';


export {
    app,
    App,
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

};

// types
export type { AppFacade } from './types/App';
export type { AuthFacade } from './types/Auth';
export type { LogFacade } from './types/Log';
export type { RouteFacade } from './types/Route';
export type { Model, BaseModel } from './types/Model';
