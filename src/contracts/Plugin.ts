/* eslint-disable @typescript-eslint/no-unused-vars */

import { AppFacade, AppFacades } from '../types/App';

export default abstract class Plugin {
    readonly name?: string;
    readonly version?: string;

    register(_app: AppFacade): void {

    }
    boot(_facades: AppFacades):void {
        
    }
}