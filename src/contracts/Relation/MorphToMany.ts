import { AppFacades } from '../../types/App';
import { BuilderInterface } from '../../types/Builder';
import { Model } from '../../types/Model';

import { Collection } from '../Collection';

import BelongsToMany from './BelongsToMany';

export default class MorphToMany extends BelongsToMany
{
    constructor(
        protected facades: AppFacades,
        protected parent: Model,
        protected related: typeof Model,
        protected items: Collection<Model> | null = null,
    ) {
        super(facades, parent, related, items);
    }
    

    query(): BuilderInterface {
        const query = super.query();

        const relation = this.guessInverseRelation();

        query.where(relation + '_id', this.parent.getKey());
        query.where(relation + '_type', this.parent.getType());
        query.lock(relation + '_id');
        query.lock(relation + '_type');

        return query;
    }

}


