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
        query.lock(relation);

        return query;
    }

    
    async saveQuietly(item: Model) {
        if (!isModel(item)) {
            throw new NotModelException('HasOneOrMany.saveQuietly()');
        }

        if (item.getType() !== this.related.getSchemaName()) {
            throw new ModelInvalidRelatedTypeException('HasOneOrMany.saveQuietly()', this.related.getSchemaName(), item.getType());
        }

        item.setAttribute(this.foreignKey as string, this.parent.getKey());

        await item.save();
    }
    
}
