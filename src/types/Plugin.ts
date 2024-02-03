import App from "../containers/App";

export type Plugin = {
    name: string;
    version: string;


    boot(app: App): void;
}