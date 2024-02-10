import { AppConfiguration, ConfigFacade } from './Config';

import Plugin from '../contracts/Plugin';
import { LogFacade } from './Log';
import { AuthFacade } from './Auth';
import { MacroFacade } from './Macro';
import { RepositoryFacade } from './Model';

export type App = {
    boot: (options: BootOptions) => Promise<AppContainers>;
};

export type AppFacade = App & {
    getContainers(): AppContainers;
    getContainer<T extends keyof AppContainers>(key: T): AppContainers[T];
    hasContainer(key: string): boolean;
    registerContainer(key: string, container: any): void;
    restart(): void;
};

export type AppContainers = {
    auth: AuthFacade;
    config: ConfigFacade;
    log: LogFacade;
    macro: MacroFacade;
    repository: RepositoryFacade;
    [key: string]: any;
};

export type AppContainerName = keyof AppContainers;

type AppGetter = () => App;
type AppContainerGetter = <T extends AppContainerName>(abstract: T) => AppContainers[T];

export type AppHelper = AppGetter & AppContainerGetter;

export type BootOptions = {
    config?: AppConfiguration;
    plugins?: Plugin[];
    macros?: (containers: AppContainers) => void;
    skipBootRequest?: boolean;
};


