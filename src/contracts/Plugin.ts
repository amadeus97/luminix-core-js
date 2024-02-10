
import App from "../facades/App";
import { AppContainers } from "../types/App";

export default abstract class Plugin {
    readonly name?: string;
    readonly version?: string;

    register?: (app: App) => void;
    boot?: (containers: AppContainers) => void;
}