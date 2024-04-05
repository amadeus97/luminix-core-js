import { AppConfiguration, ConfigFacade } from './Config';

import { PluginInterface } from './Plugin';
import { LogFacade } from './Log';
import { AuthFacade } from './Auth';
import { ModelFacade } from './Model';
import { RouteFacade } from './Route';
import { EventSource, Event } from './Event';
import { ErrorFacade } from './Error';

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


