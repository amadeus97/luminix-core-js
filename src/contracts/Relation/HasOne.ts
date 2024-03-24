import { Model } from '../../types/Model';
import { isModel } from '../../mixins/BaseModel';
import { AppFacades } from '../../types/App';

import HasOneOrMany from './HasOneOrMany';

export default class HasOne extends HasOneOrMany
{

    constructor(
        protected facades: AppFacades,
        protected parent: Model,
        protected related: typeof Model,
        protected items: Model | null = null,
        protected foreignKey: string | null = null,
    ) {
        if (!isModel(items) && items !== null) {
            throw new Error('HasOne expects a Model instance or null');
        }
        super(facades, parent, related, items, foreignKey);
    }

    get()
    {
        return this.query().first();
    }


    async save(item: Model) {
        await this.saveQuietly(item);

        this.items = item;
    }

}

