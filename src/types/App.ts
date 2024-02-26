import { AppConfiguration, ConfigFacade } from './Config';

import Plugin from '../contracts/Plugin';
import { LogFacade } from './Log';
import { AuthFacade } from './Auth';
import { MacroFacade } from './Macro';
import { RepositoryFacade } from './Model';
import { RouteFacade } from './Route';

export type AppExternal = {
    boot: (options?: BootOptions) => Promise<AppFacades>;
    make(): AppFacades;
    make<T extends keyof AppFacades>(key: T): AppFacades[T];
    plugins: () => Plugin[];
};

export interface AppFacade extends AppExternal {
    has(key: string): boolean;
    bind<T extends keyof AppFacades>(key: T, facade: AppFacades[T]): void;
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
    plugins?: Plugin[];
    skipBootRequest?: boolean;
};


