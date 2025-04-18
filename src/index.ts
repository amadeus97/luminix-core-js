import app from './helpers/app';
import auth from './helpers/auth';
import collect from './helpers/collect';
import config from './helpers/config';
import error from './helpers/error';
import log from './helpers/log';
import model from './helpers/model';
import route from './helpers/route';

import App from './facades/App';
import Auth from './facades/Auth';
import Config from './facades/Config';
import Error from './facades/Error';
import Http from './facades/Http';
import Log from './facades/Log';
import Model from './facades/Model';
import Route from './facades/Route';

import './extensions';


import { isValidationError } from './facades/Error';

import Plugin from './contracts/Plugin';

export {
    app,
    App,
    auth,
    Auth,
    collect,
    config,
    Config,
    error,
    Error,
    Http,
    log,
    Log,
    model,
    Model,
    route,
    Route,

    isValidationError,

    Plugin,

};

// types
export type { AppFacade, AppEvents, AppContainers } from './types/App';
export type { AuthFacade } from './types/Auth';
export type { BuilderInterface, Scope } from './types/Builder';
export type { AppConfiguration } from './types/Config';
export type { LogFacade } from './types/Log';
export type { Model as ModelType, BaseModel, ModelAttribute, ModelSaveOptions, ModelPaginatedResponse, ModelPaginatedLink } from './types/Model';
export type { RouteFacade, RouteReducers, HttpMethod, RouteGenerator } from './types/Route';
