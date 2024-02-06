
import App from "../containers/App";
import { AppContainers } from "./App";

export type Plugin = {
    name: string;
    version: string;

    register?: (app: App) => void;
    boot?: (containers: AppContainers) => void;
}