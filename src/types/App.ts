import App from '../containers/App';
import Auth from '../containers/Auth';
import Config from '../containers/Config';
import Macro from '../containers/Macro';
import Repository from '../containers/Repository';

import { Plugin } from './Plugin';

type AppWithNoArguments = () => App;

type AppAuth = (abstract: "auth") => Auth;
type AppConfig = (abstract: "config") => Config;
type AppMacro = (abstract: "macro") => Macro;
type AppRepository = (abstract: "repository") => Repository;
type AppForContainer = (abstract: string) => any | undefined;

export type AppHelper = AppWithNoArguments & AppAuth & AppConfig & AppMacro & AppRepository & AppForContainer;

export type BootOptions = {
    config?: any;
    plugins?: Plugin[];
    macros?: Function;
};


