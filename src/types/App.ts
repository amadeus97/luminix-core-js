import { AppConfiguration, ConfigFacade } from './Config';

import Plugin from '../contracts/Plugin';
import { LogFacade } from './Log';
import { AuthFacade } from './Auth';
import { MacroFacade } from './Macro';
import { RepositoryFacade } from './Model';
import { RouteFacade } from './Route';
import EventSource, { Event } from '../contracts/EventSource';

export type AppEvents = {
    'init': (e: InitEvent) => void,
    'booted': (e: Event<AppFacade>) => void,
}

export type InitEvent = Event<AppFacade> & {
    register(plugin: Plugin): void;
}

export type AppExternal = {
    boot: (options?: BootOptions) => Promise<AppFacades>;
    make(): AppFacades;
    make<T extends keyof AppFacades>(key: T): AppFacades[T];
    plugins: () => Plugin[];
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
    log: LogFacade;
    macro: MacroFacade;
    repository: RepositoryFacade;
    route: RouteFacade;
    [key: string]: any;
};

export type BootOptions = {
    config?: AppConfiguration;
    skipBootRequest?: boolean;
};


