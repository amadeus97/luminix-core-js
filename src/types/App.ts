import { AppConfiguration } from './Config';

import Plugin from '../contracts/Plugin';
import { LogFacade } from './Log';
import { AuthFacade } from './Auth';
import { MacroFacade } from './Macro';
import { RepositoryFacade } from './Model';
import { RouteFacade } from './Route';
import PropertyBag from '../contracts/PropertyBag';

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
    config: PropertyBag<AppConfiguration>;
    log: LogFacade;
    macro: MacroFacade;
    repository: RepositoryFacade;
    route: RouteFacade;
    [key: string]: any;
};

export type BootOptions = {
    config?: AppConfiguration;
    plugins?: Plugin[];
    macros?: (facades: AppFacades) => void;
    skipBootRequest?: boolean;
};


