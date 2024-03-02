import App from "../facades/App";
import { AppExternal, AppFacade, AppFacades } from "../types/App";

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
        };
    }

    if (!appInstance.has(facade)) {
        throw new Error(`[Luminix] Facade not found: ${facade}`);
    }

    return appInstance.make(facade);

}

export default app;
