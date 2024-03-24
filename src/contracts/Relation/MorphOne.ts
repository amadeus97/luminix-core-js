
import NotModelException from '../../exceptions/NotModelException';
import { AppFacades } from '../../types/App';
import { Model } from '../../types/Model';
import { isModel } from '../../mixins/BaseModel';


import MorphOneOrMany from './MorphOneOrMany';


export default class MorphOne extends MorphOneOrMany
{
    constructor(
        protected facades: AppFacades,
        protected parent: Model,
        protected related: typeof Model,
        protected items: Model | null = null,
        protected foreignKey: string | null = null,
    ) {
        super(facades, parent, related, items, foreignKey);

        if (items !== null && !isModel(items)) {
            throw new NotModelException('MorphOne.constructor()', 'Model or null');
        }
    }

    get()
    {
        return this.query().first();
    }

    async save(item: Model)
    {
        await this.saveQuietly(item);

        this.items = item;
    }
}
