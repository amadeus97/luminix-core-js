import ModelInvalidRelatedTypeException from '../../exceptions/ModelInvalidRelatedTypeException';
import NotModelException from '../../exceptions/NotModelException';
import { isModel } from '../../mixins/BaseModel';
import { BuilderInterface } from '../../types/Builder';
import { Model } from '../../types/Model';

import Relation from '../Relation';


export default class HasOneOrMany extends Relation {

    query(): BuilderInterface {
        const query = super.query();

        const relation = this.guessInverseRelation();

        query.where(relation, this.parent.getKey());
        query.lock(`filters.${relation}`);

        return query;
    }

    
    async saveQuietly(item: Model) {
        if (!isModel(item)) {
            throw new NotModelException('HasOneOrMany.saveQuietly()');
        }

        if (item.getType() !== this.getRelated().getSchemaName()) {
            throw new ModelInvalidRelatedTypeException('HasOneOrMany.saveQuietly()', this.getRelated().getSchemaName(), item.getType());
        }

        item.setAttribute(this.getForeignKey() as string, this.parent.getKey());

        await item.save();
    }
    
}
