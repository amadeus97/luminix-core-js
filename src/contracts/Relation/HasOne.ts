import { Obj } from '@luminix/support';
import { Model, RelationMetaData } from '../../types/Model';

import HasOneOrMany from './HasOneOrMany';
import NotModelException from '../../exceptions/NotModelException';
import { RelationServices } from '../Relation';

export default class HasOne extends HasOneOrMany
{

    constructor(
        protected services: RelationServices,
        protected meta: RelationMetaData,        
        protected parent: Model,
        protected items: Model | null = null,
    ) {
        if (!Obj.isModel(items) && items !== null) {
            throw new NotModelException('HasOne.constructor()', 'Model or null');
        }
        super(services, meta, parent, items);
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


    async save(item: Model) {
        await this.saveQuietly(item);

        this.items = item;
    }

}

