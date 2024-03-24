import Relation from '../Relation';
import { Model } from '../../types/Model';
import { isModel } from '../../mixins/BaseModel';

import { AppFacades } from '../../types/App';
import { BuilderInterface } from '../../types/Builder';


export default class BelongsTo extends Relation {

    constructor(
        protected facades: AppFacades,
        protected parent: Model,
        protected related: typeof Model,
        protected items: Model | null = null,
        protected foreignKey: string,
    ) {
        if (!isModel(items) && items !== null) {
            throw new Error('BelongsTo expects a Model instance or null');
        }
        super(facades, parent, related, items, foreignKey);
    }

    query(): BuilderInterface {
        const query = super.query();

        const relation = this.guessInverseRelation();

        query.where(relation, this.parent.getKey());
        query.lock(relation);

        return query;
    }

    get() {
        return this.query().first();
    }


    async associate(item: Model) {
        if (!isModel(item)) {
            throw new Error('BelongsTo associate method expects a Model instance');
        }

        if (item.getType() !== this.related.getSchemaName()) {
            throw new Error(`BelongsTo associate method expects a '${this.related.getSchemaName()}' instance`);
        }

        if (!item.exists) {
            await item.save();
        }

        return this.parent.update({
            [this.foreignKey]: item.getKey(),
        });
    }

    dissociate() {
        return this.parent.update({
            [this.foreignKey]: null,
        });
    }


}

