import App from '../facades/App';
import { AppExternal, AppFacades } from '../types/App';

function app(): AppExternal;
function app<T extends keyof AppFacades>(facade:T): AppFacades[T];
function app(abstract: string | undefined = undefined) {

    if (typeof abstract !== 'string') {
        return App;
    }

    return App.make(abstract);
}

export default app;
