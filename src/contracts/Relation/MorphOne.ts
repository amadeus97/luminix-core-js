
import NotModelException from '../../exceptions/NotModelException';
import { AppFacades } from '../../types/App';
import { Model, RelationMetaData } from '../../types/Model';
import { isModel } from '../../mixins/BaseModel';


import MorphOneOrMany from './MorphOneOrMany';


export default class MorphOne extends MorphOneOrMany
{
    constructor(
        protected meta: RelationMetaData,
        protected facades: AppFacades,
        protected parent: Model,
        protected items: Model | null = null,
    ) {
        super(meta, facades, parent, items);

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
