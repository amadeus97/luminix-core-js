import { AppFacade, AppFacades } from './App';


export type PluginInterface = {
    register(app: AppFacade): void;
    boot(facades: AppFacades): void;


}



