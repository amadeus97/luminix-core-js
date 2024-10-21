import { MacroableInterface } from '@luminix/support';
import { AppMacros } from './types/App';
import { Model } from './types/Model';

declare module '@luminix/support' {
    interface ApplicationInterface extends MacroableInterface<AppMacros>, AppMacros {
    }

    interface ObjMacros {
        isModel(value: unknown): value is Model;
    }
}
