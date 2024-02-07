import Auth from '../containers/Auth';
import Config from '../containers/Config';
import Macro from '../containers/Macro';
import Repository from '../containers/Repository';
import { AppConfiguration } from './Config';

import Plugin from '../contracts/Plugin';

export type App = {
    boot: (options: BootOptions) => Promise<AppContainers>;
};

export type AppInternal = App & {
    getContainers(): AppContainers;
    getContainer<T extends keyof AppContainers>(key: T): AppContainers[T];
    hasContainer(key: string): boolean;
    registerContainer(key: string, container: any): void;
    restart(): void;
};

export type AppContainers = {
    auth: Auth;
    config: Config;
    macro: Macro;
    repository: Repository;
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


