import App from '../containers/App';

type AppWithNoArguments = () => App;

type AppForContainer = (abstract?: string) => any | undefined;

export type AppHelper = AppWithNoArguments & AppForContainer;