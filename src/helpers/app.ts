import FacadeNotFoundException from '../exceptions/FacadeNotFoundException';
import App from '../facades/App';
import { AppExternal, AppFacade, AppFacades } from '../types/App';

let appInstance: AppFacade;

function app(): AppExternal;
function app<T extends keyof AppFacades>(facade:T): AppFacades[T];
function app(facade = undefined) {
    if (!appInstance) {
        appInstance = new App();
    }

    if (typeof facade !== 'string') {
        return {
            boot: appInstance.boot.bind(appInstance),
            make: appInstance.make.bind(appInstance),
            plugins: appInstance.plugins.bind(appInstance),
            on: appInstance.once.bind(appInstance),
            environment: appInstance.environment.bind(appInstance),
            getLocale: appInstance.getLocale.bind(appInstance),
            getPlugin: appInstance.getPlugin.bind(appInstance),
            hasDebugModeEnabled: appInstance.hasDebugModeEnabled.bind(appInstance),
            isLocal: appInstance.isLocal.bind(appInstance),
            isProduction: appInstance.isProduction.bind(appInstance),
            setInstance: (app: AppFacade) => appInstance = app,
        };
    }

    if (!appInstance.has(facade)) {
        throw new FacadeNotFoundException(facade);
    }

    return appInstance.make(facade);

}

export default app;
