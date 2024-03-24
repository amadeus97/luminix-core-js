import { isModel } from '../../mixins/BaseModel';
import { BuilderInterface } from '../../types/Builder';
import { Model } from '../../types/Model';

import Relation from '../Relation';


export default class HasOneOrMany extends Relation {

    private guessInverseRelation(): string {
        const { relations } = this.related.getSchema();

        for (const relationName in relations) {
            const relation = relations[relationName];

            if (relation.model === this.parent.getType() && ['BelongsTo'].includes(relation.type)) {
                return relationName;
            }
        }

        throw new Error('To query a HasOne or HasMany relation, the related model must have a BelongsTo or HasOne relation to the parent model');
    }

    query(): BuilderInterface {
        const query = super.query();

        const relation = this.guessInverseRelation();

        query.where(relation, this.parent.getKey());
        query.lock(relation);

        return query;
    }

    
    async saveQuietly(item: Model) {
        if (!isModel(item)) {
            throw new Error('HasOneOrMany save method expects a Model instance');
        }

        if (item.getType() !== this.related.getSchemaName()) {
            throw new Error(`HasOneOrMany save method expects a '${this.related.getSchemaName()}' instance`);
        }

        item.setAttribute(this.foreignKey as string, this.parent.getKey());

        await item.save();
    }
    
}
