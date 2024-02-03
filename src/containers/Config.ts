import { objectExistsByPath, objectGetByPath, objectSetByPath } from "../support/object";

export default class Config {
    constructor(
        private config: { [key: string]: any } = {}
    ) {

    }

    get(key: string, defaultValue?: any) {
        if (objectExistsByPath(this.config, key)) {
            return objectGetByPath(this.config, key);
        }
        return defaultValue;
    }

    set(key: string, value: any) {
        objectSetByPath(this.config, key, value);
    }
}
