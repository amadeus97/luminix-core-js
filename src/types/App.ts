import { AppConfiguration, ConfigFacade } from './Config';

import { PluginInterface } from './Plugin';
import { LogFacade } from './Log';
import { AuthFacade } from './Auth';
import { BaseModel, Model, ModelSchema, ModelSchemaAttributes } from './Model';
import { RouteFacade } from './Route';
import { EventSource, Event } from './Event';
import { ErrorFacade } from './Error';
import { ReducibleInterface } from './Reducer';
import { Constructor } from './Support';

type Plugin = PluginInterface<AppFacade, AppFacades>;


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
    register(plugin: Plugin): void;
}

export type AppExternal = {
    boot: (config?: AppConfiguration) => Promise<AppFacades>;
    make(): AppFacades;
    make<T extends keyof AppFacades>(key: T): AppFacades[T];
    plugins: () => Plugin[];
    on: EventSource<AppEvents>['once'];

    environment(): string;
    environment(...environments: string[]): boolean;

    getPlugin<T extends Plugin>(abstract: Constructor<T>): T | undefined;
    getLocale(): string;
    hasDebugModeEnabled(): boolean;
    isLocal(): boolean;
    isProduction(): boolean;

    setInstance(app: AppFacade): void;
};

export type AppFacade = Omit<AppExternal, 'setInstance'> & {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

export type BootOptions = {
    config?: AppConfiguration;
    skipBootRequest?: boolean;
};


