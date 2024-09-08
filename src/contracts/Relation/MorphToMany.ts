import { BuilderInterface as Builder } from '../../types/Builder';
import { Model, ModelPaginatedResponse } from '../../types/Model';

import BelongsToMany from './BelongsToMany';


type BuilderInterface = Builder<Model, ModelPaginatedResponse>;

export default class MorphToMany extends BelongsToMany
{   

    query(): BuilderInterface {
        const query = super.query();

        const relation = this.guessInverseRelation();

        query.where(relation + '_id', this.parent.getKey());
        query.where(relation + '_type', this.parent.getType());
        query.lock(`where.${relation}_id`);
        query.lock(`where.${relation}_type`);

        return query;
    }

}


