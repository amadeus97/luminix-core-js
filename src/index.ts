import app from './helpers/app';
import auth from './helpers/auth';
import config from './helpers/config';
import error from './helpers/error';
import log from './helpers/log';
import model from './helpers/model';
import route from './helpers/route';

import Plugin from './contracts/Plugin';
import PropertyBag from './contracts/PropertyBag';
import { Macroable } from './contracts/Macroable';
import { HasEvents } from './contracts/HasEvents';

export {
    app,
    auth,
    config,
    error,
    log,
    model,
    route,

    Plugin,
    PropertyBag,
    Macroable,
    HasEvents,
};

// types
export type { AppFacade } from './types/App';
export type { AuthFacade } from './types/Auth';
export type { LogFacade } from './types/Log';
export type { RepositoryFacade } from './types/Model';
export type { RouteFacade } from './types/Route';
export type { Model as ProxyModel, BaseModel as Model } from './types/Model';
