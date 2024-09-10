import { EventSource, Event, ReducibleInterface, FacadeOf, HasFacadeAccessor, Application, MacroableInterface } from '@luminix/support';

import { AppConfiguration, ConfigFacade } from './Config';

import { PluginInterface } from './Plugin';
import { LogFacade } from './Log';

import {
    BaseModel, Model, ModelPaginatedResponse, ModelReducers,
    ModelSchema, ModelSchemaAttributes
} from './Model';
import { RouteFacade } from './Route';
import { ErrorFacade } from './Error';
import { Constructor } from './Support';

import { RelationInterface } from './Relation';
import { AuthFacade } from './Auth';
import { HttpFacade } from './Http';

type Plugin = PluginInterface<AppFacade, AppContainers>;


export type GlobalModelEvents = {
    'save': (e: ModelGlobalEvent) => void,
    'delete': (e: ModelGlobalEvent) => void,
    'restore': (e: ModelGlobalEvent) => void,
    'create': (e: ModelGlobalEvent) => void,
    'update': (e: ModelGlobalEvent) => void,
    'fetch': (e: ModelGlobalEvent) => void,
    'error': (e: ModelGlobalErrorEvent) => void,
}


export type ModelGlobalEvent = Event<{
    class: string,
    model: BaseModel,
    force?: boolean,
}, ModelFacade>;


export type ModelGlobalErrorEvent = ModelGlobalEvent & {
    error: unknown,
    operation: 'save' | 'delete' | 'restore' | 'forceDelete',
};



export type ModelFacade = EventSource<GlobalModelEvents> & ModelReducers & ReducibleInterface<ModelReducers> & {
    schema(): ModelSchema;
    schema(abstract: string): ModelSchemaAttributes;
    make(): Record<string, typeof Model>;
    make(abstract: string): typeof Model;
    boot(app: AppFacade): void;
    getRelationConstructors(abstract: string): Record<string, Constructor<RelationInterface<Model, ModelPaginatedResponse>>>;
}

export type AppEvents = {
    'init': (e: InitEvent) => void,
    // eslint-disable-next-line @typescript-eslint/ban-types
    'booted': (e: Event<{}, AppFacade>) => void,
    // eslint-disable-next-line @typescript-eslint/ban-types
    'booting': (e: Event<{}, AppFacade>) => void,
}

export type InitEvent = Event<{
    register(plugin: Plugin): void;
}, AppFacade>;

/** @deprecated */
export type AppExternal = {
    boot: (config?: AppConfiguration) => Promise<AppContainers>;

    /** @deprecated */
    make(): AppContainers;

    make<T extends keyof AppContainers>(key: T): AppContainers[T];
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

export type AppFacade = FacadeOf<Application<AppContainers> & AppMacros & MacroableInterface<AppMacros>, HasFacadeAccessor> & {
    down(): void;
};


export type AppContainers = {
    auth: FacadeOf<AuthFacade, HasFacadeAccessor>;
    config: FacadeOf<ConfigFacade, HasFacadeAccessor>;
    error: FacadeOf<ErrorFacade, HasFacadeAccessor>;
    http: FacadeOf<HttpFacade, HasFacadeAccessor>;
    log: FacadeOf<LogFacade, HasFacadeAccessor>;
    model: FacadeOf<ModelFacade, HasFacadeAccessor>;
    route: FacadeOf<RouteFacade, HasFacadeAccessor>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

export type BootOptions = {
    config?: AppConfiguration;
    skipBootRequest?: boolean;
};

export type AppMacros = {
    environment(...environments: string[]): string | boolean;
    getLocale(): string;
    hasDebugModeEnabled(): boolean;
    isLocal(): boolean;
    isProduction(): boolean;
};
