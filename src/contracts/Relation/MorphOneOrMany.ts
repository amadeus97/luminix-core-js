import { BuilderInterface } from '../../types/Builder';
import { Model } from '../../types/Model';
import { isModel } from '../../mixins/BaseModel';

import HasOneOrMany from './HasOneOrMany';
import NotModelException from '../../exceptions/NotModelException';
import ModelInvalidRelatedTypeException from '../../exceptions/ModelInvalidRelatedTypeException';


export default class MorphOneOrMany extends HasOneOrMany
{

    query(): BuilderInterface {
        const query = this.related.query();

        query.once('success', (e) => {
            this.items = e.items;
        });

        const relation = this.guessInverseRelation();

        query.where(relation + '_id', this.parent.getKey());
        query.where(relation + '_type', this.related.getSchemaName());
        query.lock(relation + '_id');
        query.lock(relation + '_type');

        return query;
    }

    async saveQuietly(item: Model) {
        if (!isModel(item)) {
            throw new NotModelException('MorphOneOrMany.saveQuietly()');
        }

        if (item.getType() !== this.related.getSchemaName()) {
            throw new ModelInvalidRelatedTypeException('MorphOneOrMany.saveQuietly()', this.related.getSchemaName(), item.getType());
        }

        const relation = this.guessInverseRelation();

        item.setAttribute(relation + '_id', this.parent.getKey());
        item.setAttribute(relation + '_type', this.parent.getType());

        await item.save();
    }
}

