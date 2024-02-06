import App from "../containers/App";
import { AppContainerName, AppHelper } from "../types/App";

const appInstance = new App();

const app: AppHelper = (abstract?: AppContainerName) => {
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
