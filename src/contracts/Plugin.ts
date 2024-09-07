/* eslint-disable @typescript-eslint/no-unused-vars */

import { AppFacade, AppContainers } from '../types/App';

export default abstract class Plugin {
    readonly name?: string;
    readonly version?: string;

    register(_app: AppFacade): void {

    }
    boot(_facades: AppContainers):void {
        
    }
}