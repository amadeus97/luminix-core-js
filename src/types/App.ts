import { AppConfiguration, ConfigFacade } from './Config';

import { PluginInterface } from './Plugin';
import { LogFacade } from './Log';
import { AuthFacade } from './Auth';
import { BaseModel, Model, ModelSchema, ModelSchemaAttributes } from './Model';
import { RouteFacade } from './Route';
import { EventSource, Event } from './Event';
import { ErrorFacade } from './Error';
import { ReducibleInterface } from './Reducer';


export type GlobalModelEvents = {
    'save': (e: ModelGlobalEvent) => void,
    'delete': (e: ModelGlobalEvent) => void,
    'restore': (e: ModelGlobalEvent) => void,
    'create': (e: ModelGlobalEvent) => void,
    'update': (e: ModelGlobalEvent) => void,
    'fetch': (e: ModelGlobalEvent) => void,
    'error': (e: ModelGlobalErrorEvent) => void,
}


export type ModelGlobalEvent = Event<ModelFacade> & {
    class: string,
    model: BaseModel,
    force?: boolean,
};


export type ModelGlobalErrorEvent = ModelGlobalEvent & {
    error: unknown,
    operation: 'save' | 'delete' | 'restore' | 'forceDelete',
};



export type ModelFacade = EventSource<GlobalModelEvents> & ReducibleInterface & {
    schema(): ModelSchema;
    schema(abstract: string): ModelSchemaAttributes;
    make(): Record<string, typeof Model>;
    make(abstract: string): typeof Model;
    boot(app: AppFacade): void;
    
}


export type AppEvents = {
    'init': (e: InitEvent) => void,
    'booted': (e: Event<AppFacade>) => void,
    'booting': (e: Event<AppFacade>) => void,
}

export type InitEvent = Event<AppFacade> & {
    register(plugin: PluginInterface): void;
}

export type AppExternal = {
    boot: (config?: AppConfiguration) => Promise<AppFacades>;
    make(): AppFacades;
    make<T extends keyof AppFacades>(key: T): AppFacades[T];
    plugins: () => PluginInterface[];
    on: EventSource<AppEvents>['once'];
};

export type AppFacade = AppExternal & {
    has(key: string): boolean;
    bind<T extends keyof AppFacades>(key: T, facade: AppFacades[T]): void;
    emit: EventSource<AppEvents>['emit'];
    once: EventSource<AppEvents>['once'];
    on: EventSource<AppEvents>['on'];
};

export type AppFacades = {
    auth: AuthFacade;
    config: ConfigFacade;
    error: ErrorFacade;
    log: LogFacade;
    model: ModelFacade;
    route: RouteFacade;
    [key: string]: unknown;
};

export type BootOptions = {
    config?: AppConfiguration;
    skipBootRequest?: boolean;
};


