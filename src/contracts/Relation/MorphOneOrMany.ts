import { Obj } from '@luminix/support';
import { BuilderInterface as Builder } from '../../types/Builder';
import { Model, ModelPaginatedResponse } from '../../types/Model';

import HasOneOrMany from './HasOneOrMany';
import NotModelException from '../../exceptions/NotModelException';
import ModelInvalidRelatedTypeException from '../../exceptions/ModelInvalidRelatedTypeException';

type BuilderInterface = Builder<Model,ModelPaginatedResponse>;

export default class MorphOneOrMany extends HasOneOrMany
{

    query(): BuilderInterface {
        const query = this.getRelated().query();

        query.once('success', (e) => {
            this.items = e.items;
        });

        const relation = this.guessInverseRelation();

        query.where(relation + '_id', this.parent.getKey());
        query.where(relation + '_type', this.getRelated().getSchemaName());
        query.lock(`where.${relation}_id`);
        query.lock(`where.${relation}_type`);

        return query;
    }

    async saveQuietly(item: Model) {
        if (!Obj.isModel(item)) {
            throw new NotModelException('MorphOneOrMany.saveQuietly()');
        }

        if (item.getType() !== this.getRelated().getSchemaName()) {
            throw new ModelInvalidRelatedTypeException('MorphOneOrMany.saveQuietly()', this.getRelated().getSchemaName(), item.getType());
        }

        const relation = this.guessInverseRelation();

        item.setAttribute(relation + '_id', this.parent.getKey());
        item.setAttribute(relation + '_type', this.parent.getType());

        await item.save();
    }
}

