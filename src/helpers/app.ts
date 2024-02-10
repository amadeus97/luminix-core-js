import App from "../facades/App";
import { AppContainerName, AppHelper } from "../types/App";

let appInstance: App;

const app: AppHelper = (abstract?: AppContainerName) => {
    if (!appInstance) {
        appInstance = new App();
    }

    if (typeof abstract !== 'string') {
        return {
            boot: appInstance.boot.bind(appInstance),
        };
    }

    if (!appInstance.hasContainer(abstract)) {
        throw new Error(`[Luminix] Container not found: ${abstract}`);
    }

    return appInstance.getContainer(abstract);

}

export default app;
