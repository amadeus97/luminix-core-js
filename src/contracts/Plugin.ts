
import App from "../facades/App";
import { AppFacades } from "../types/App";

export default abstract class Plugin {
    readonly name?: string;
    readonly version?: string;

    register?: (app: App) => void;
    boot?: (facades: AppFacades) => void;
}