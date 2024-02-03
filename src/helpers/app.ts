import App from "../containers/App";
import { AppHelper } from "../types/App";

const appInstance = new App();

const app: AppHelper = (abstract?) => {
    if (typeof abstract !== 'string') {
        return appInstance;
    }

    if (!appInstance.hasContainer(abstract)) {
        throw new Error(`[Luminix] Container not found: ${abstract}`);
    }

    return appInstance.getContainer(abstract);

}

export default app;
