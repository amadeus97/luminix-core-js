
import NotModelException from '../../exceptions/NotModelException';
import { AppContainers } from '../../types/App';
import { Model, RelationMetaData } from '../../types/Model';
import { isModel } from '../../support/model';


import MorphOneOrMany from './MorphOneOrMany';


export default class MorphOne extends MorphOneOrMany
{
    constructor(
        protected meta: RelationMetaData,
        protected facades: AppContainers,
        protected parent: Model,
        protected items: Model | null = null,
    ) {
        super(meta, facades, parent, items);

        if (items !== null && !isModel(items)) {
            throw new NotModelException('MorphOne.constructor()', 'Model or null');
        }
    }

    isSingle(): boolean {
        return true;
    }

    isMultiple(): boolean {
        return false;
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
