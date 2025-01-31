import { HasFacadeAccessor, Application, MakeFacade, Macroable, FacadeOf, MacroableInterface } from '@luminix/support';

import { AppContainers, AppMacros } from '../types/App';

import LuminixServiceProvider from '../providers/LuminixServiceProvider';


class AppFacade implements HasFacadeAccessor
{

    protected app?: Application;

    getFacadeAccessor(): string | object {

        if (!this.app) {
            this.app = new (Macroable(Application))([
                LuminixServiceProvider,
            ]);
        }

        return this.app;
    }

    down() {
        if (this.app) {
            this.app.flush();
            delete this.app;
        }
    }

    setInstance(app: Application) {
        this.down();
        this.app = app;
    }

}

const App: FacadeOf<Application<AppContainers> & AppMacros & MacroableInterface<AppMacros>, AppFacade> = MakeFacade(AppFacade);

export default App;

