import Auth from '../containers/Auth';
import Config from '../containers/Config';
import Macro from '../containers/Macro';
import Repository from '../containers/Repository';

import { Plugin } from './Plugin';

export type AppContainers = {
    auth: Auth;
    config: Config;
    macro: Macro;
    repository: Repository;
    [key: string]: any;
};

export type AppContainerName = keyof AppContainers;

type AppGetter = () => ({
    boot: (options: BootOptions) => Promise<AppContainers>;
});
type AppContainerGetter = <T extends AppContainerName>(abstract: T) => AppContainers[T];

export type AppHelper = AppGetter & AppContainerGetter;

export type BootOptions = {
    config?: any;
    plugins?: Plugin[];
    macros?: (containers: AppContainers) => void;
};


