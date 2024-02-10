import { AppConfiguration, ConfigFacade } from './Config';

import Plugin from '../contracts/Plugin';
import { LogFacade } from './Log';
import { AuthFacade } from './Auth';
import { MacroFacade } from './Macro';
import { RepositoryFacade } from './Model';

export type App = {
    boot: (options: BootOptions) => Promise<AppFacades>;
    make(): AppFacades;
    make<T extends keyof AppFacades>(key: T): AppFacades[T];
    plugins: () => Plugin[];
};

export type AppFacade = App & {
    has(key: string): boolean;
    add(key: string, facade: any): void;
    restart(): void;
};

export type AppFacades = {
    auth: AuthFacade;
    config: ConfigFacade;
    log: LogFacade;
    macro: MacroFacade;
    repository: RepositoryFacade;
    [key: string]: any;
};

export type AppFacadeName = keyof AppFacades;

type AppGetter = () => App;
type AppFacadeGetter = <T extends AppFacadeName>(facade: T) => AppFacades[T];

export type AppHelper = AppGetter & AppFacadeGetter;

export type BootOptions = {
    config?: AppConfiguration;
    plugins?: Plugin[];
    macros?: (facades: AppFacades) => void;
    skipBootRequest?: boolean;
};


