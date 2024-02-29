
import App from "../facades/App";
import { AppFacades } from "../types/App";

export default abstract class Plugin {
    readonly name?: string;
    readonly version?: string;

    register(_app: App): void {}
    boot(_facades: AppFacades):void {}
}