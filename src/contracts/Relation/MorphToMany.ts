import { AppFacades } from '../../types/App';
import { BuilderInterface } from '../../types/Builder';
import { Model, RelationMetaData } from '../../types/Model';

import { Collection } from '../../types/Collection';

import BelongsToMany from './BelongsToMany';

export default class MorphToMany extends BelongsToMany
{
    constructor(
        protected meta: RelationMetaData,
        protected facades: AppFacades,
        protected parent: Model,
        protected items: Collection<Model> | null = null,
    ) {
        super(meta, facades, parent, items);
    }
    

    query(): BuilderInterface {
        const query = super.query();

        const relation = this.guessInverseRelation();

        query.where(relation + '_id', this.parent.getKey());
        query.where(relation + '_type', this.parent.getType());
        query.lock(`filters.${relation}_id`);
        query.lock(`filters.${relation}_type`);

        return query;
    }

}


