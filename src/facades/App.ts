import { HasFacadeAccessor, Application, MakeFacade, Macroable, FacadeOf, MacroableInterface } from '@luminix/support';

import { AppContainers, AppMacros } from '../types/App';

import LuminixServiceProvider from '../providers/LuminixServiceProvider';

declare module '@luminix/support' {
    interface ApplicationInterface extends MacroableInterface<AppMacros>, AppMacros {
    }
}

let application: Application;

class AppFacade implements HasFacadeAccessor
{

    getFacadeAccessor(): string | object {

        if (!application) {
            application = new (Macroable(Application))([
                LuminixServiceProvider,
            ]);
        }

        return application;
    }

}

const App: FacadeOf<Application<AppContainers> & AppMacros & MacroableInterface<AppMacros>, AppFacade> = MakeFacade(AppFacade);

export default App;

