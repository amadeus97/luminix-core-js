
import NotModelException from '../../exceptions/NotModelException';
import { Model, RelationMetaData } from '../../types/Model';
import { isModel } from '../../support/model';


import MorphOneOrMany from './MorphOneOrMany';
import { RelationServices } from '../Relation';


export default class MorphOne extends MorphOneOrMany
{
    constructor(
        protected services: RelationServices,
        protected meta: RelationMetaData,
        protected parent: Model,
        protected items: Model | null = null,
    ) {
        super(services, meta, parent, items);

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
