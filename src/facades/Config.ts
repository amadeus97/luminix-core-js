import _ from 'lodash';
// import { objectExistsByPath, objectGetByPath, objectSetByPath } from '../support/object';
import { AppConfiguration, ConfigFacade } from '../types/Config';
import { LogFacade } from '../types/Log';
import PropertyBag from '../contracts/PropertyBag';

export default class Config implements ConfigFacade {
    private config: PropertyBag<AppConfiguration>;

    constructor(
        config: AppConfiguration,
        private readonly log: LogFacade,
    ) {
        this.config = new PropertyBag(config);
    }

    get(path: string, defaultValue?: any) {
        return this.config.get(path, defaultValue);
    }

    set(path: string, value: any) {
        this.config.set(path, value);
    }

    merge(path: string, value: any) {
        return this.config.merge(path, value);
    }

    has(path: string) {
        return this.config.has(path);
    }

    all() {
        return this.config.all();
    }

    delete(path: string) {
        return this.config.delete(path);
    }

    lock(path: string) {
        this.config.lock(path);
    }
}
