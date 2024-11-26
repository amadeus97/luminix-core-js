import { Obj } from '@luminix/support';
import ModelInvalidRelatedTypeException from '../../exceptions/ModelInvalidRelatedTypeException';
import NotModelException from '../../exceptions/NotModelException';

import { BuilderInterface as Builder } from '../../types/Builder';
import { Model, ModelPaginatedResponse } from '../../types/Model';

import Relation from '../Relation';

type BuilderInterface = Builder<Model, ModelPaginatedResponse>;

export default class HasOneOrMany extends Relation {

    query(): BuilderInterface {
        const query = super.query();

        const relation = this.guessInverseRelation();

        query.where(relation, this.parent.getKey());
        query.lock(`where.${relation}`);

        return query;
    }

    
    async saveQuietly(item: Model) {
        if (!Obj.isModel(item)) {
            throw new NotModelException('HasOneOrMany.saveQuietly()');
        }

        if (item.getType() !== this.getRelated().getSchemaName()) {
            throw new ModelInvalidRelatedTypeException('HasOneOrMany.saveQuietly()', this.getRelated().getSchemaName(), item.getType());
        }

        item.setAttribute(this.getForeignKey() as string, this.parent.getKey());

        await item.save();
    }
    
}
