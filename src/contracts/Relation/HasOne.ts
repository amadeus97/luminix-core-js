import { Model, RelationMetaData } from '../../types/Model';
import { isModel } from '../../support/model';
import { AppContainers } from '../../types/App';

import HasOneOrMany from './HasOneOrMany';
import NotModelException from '../../exceptions/NotModelException';

export default class HasOne extends HasOneOrMany
{

    constructor(
        protected meta: RelationMetaData,
        protected facades: AppContainers,
        protected parent: Model,
        protected items: Model | null = null,
    ) {
        if (!isModel(items) && items !== null) {
            throw new NotModelException('HasOne.constructor()', 'Model or null');
        }
        super(meta, facades, parent, items);
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

