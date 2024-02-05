import { objectExistsByPath, objectGetByPath, objectSetByPath } from "../support/object";

export default class Config {

    private locked: string[] = [];

    constructor(
        private readonly config: { [key: string]: any } = {}
    ) {

    }

    get(path: string, defaultValue?: any) {
        if (objectExistsByPath(this.config, path)) {
            return objectGetByPath(this.config, path);
        }
        return defaultValue;
    }

    set(path: string, value: any) {
        if (this.locked.some((item) => path.startsWith(item))) {
            if (this.get('app.debug', false)) {
                console.warn(`Config path "${path}" is locked. Cannot set value.`);
            }
            return;
        }
        objectSetByPath(this.config, path, value);
    }

    delete(path: string) {
        if (this.locked.some((item) => path.startsWith(item))) {
            if (this.get('app.debug', false)) {
                console.warn(`Config path "${path}" is locked. Cannot delete value.`);
            }
            return;
        }
        objectSetByPath(this.config, path, undefined);
    }

    lock(path: string) {
        if (this.locked.some((item) => path.startsWith(item))) {
            return;
        }
        this.locked.push(path);
    }
}
