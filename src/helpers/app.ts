import App from "../facades/App";
import { AppFacadeName, AppHelper } from "../types/App";

let appInstance: App;

const app: AppHelper = (facade?: AppFacadeName) => {
    if (!appInstance) {
        appInstance = new App();
    }

    if (typeof facade !== 'string') {
        return {
            boot: appInstance.boot.bind(appInstance),
            all: appInstance.all.bind(appInstance),
            plugins: appInstance.plugins.bind(appInstance),
        };
    }

    if (!appInstance.has(facade)) {
        throw new Error(`[Luminix] Facade not found: ${facade}`);
    }

    return appInstance.make(facade);

}

export default app;
