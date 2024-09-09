
import App from '../facades/App';
import { AppContainers, AppFacade } from '../types/App';

function app(): AppFacade;
function app<T extends keyof AppContainers>(facade:T): AppContainers[T];
function app(abstract: string | undefined = undefined) {

    if (typeof abstract !== 'string') {
        return App;
    }

    return App.make(abstract);
}

export default app;
