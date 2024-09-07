import App from '../facades/App';
import { AppExternal, AppContainers } from '../types/App';

function app(): AppExternal;
function app<T extends keyof AppContainers>(facade:T): AppContainers[T];
function app(abstract: string | undefined = undefined) {

    if (typeof abstract !== 'string') {
        return App;
    }

    return App.make(abstract);
}

export default app;
