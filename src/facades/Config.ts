import { objectExistsByPath, objectGetByPath, objectSetByPath } from "../support/object";
import { AppConfiguration, ConfigFacade } from "../types/Config";
import { LogFacade } from "../types/Log";

export default class Config implements ConfigFacade {

    private locked: string[] = [];

    constructor(
        private readonly config: AppConfiguration = {},
        private readonly log: LogFacade,
    ) {

    }

    get(path: string, defaultValue?: any) {
        if (objectExistsByPath(this.config, path)) {
            return objectGetByPath(this.config, path);
        }
        return defaultValue;
    }

    set(path: string, value: any) {
        if (!this.locked.some((item) => path.startsWith(item))) {
            objectSetByPath(this.config, path, value);
            return;
        }
        this.log.warning(`Config path "${path}" is locked. Cannot set value.`, this.locked);
    }

    merge(path: string, value: any) {
        if (this.locked.some((item) => path.startsWith(item))) {
            this.log.warning(`Config path "${path}" is locked. Cannot set value.`, this.locked);
            return;
        }

        const currentValue = this.get(path);

        if (typeof currentValue === 'object' && currentValue !== null) {
            return this.set(path, {
                ...currentValue,
                ...value,
            });
        }

        if (currentValue === null || typeof currentValue === 'undefined') {
            return this.set(path, value);
        }

        this.log.warning(`Config is trying to merge a path with non-object`, {
            path, currentValue, value
        });
    }

    has(path: string) {
        return objectExistsByPath(this.config, path);
    }

    all() {
        return this.config;
    }

    delete(path: string) {
        if (this.locked.some((item) => path.startsWith(item))) {
            this.log.warning(`Config path "${path}" is locked. Cannot delete value.`);
            return;
        }
        objectSetByPath(this.config, path, undefined);
    }

    lock(path: string) {
        if (this.locked.length && this.locked.some((item) => path.startsWith(item))) {
            return;
        }
        this.locked.push(path);
    }
}
