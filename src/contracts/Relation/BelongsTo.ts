import Relation from '../Relation';
import { Model, ModelPaginatedResponse, RelationMetaData } from '../../types/Model';

import { isModel } from '../../support/model';

import { BuilderInterface as Builder } from '../../types/Builder';
import NotModelException from '../../exceptions/NotModelException';
import ModelInvalidRelatedTypeException from '../../exceptions/ModelInvalidRelatedTypeException';
import ModelNotPersistedException from '../../exceptions/ModelNotPersistedException';
import { ModelFacade } from '../../types/App';

type BuilderInterface = Builder<Model, ModelPaginatedResponse>;


export default class BelongsTo extends Relation {

    constructor(
        protected model: ModelFacade,
        protected meta: RelationMetaData,
        protected parent: Model,
        protected items: Model | null = null,
    ) {
        if (!isModel(items) && items !== null) {
            throw new NotModelException('BelongsTo.constructor()', 'Model or null');
        }
        super(model, meta, parent, items);
    }

    isSingle(): boolean {
        return true;
    }

    isMultiple(): boolean {
        return false;
    }

    query(): BuilderInterface {
        const query = super.query();

        const relation = this.guessInverseRelation();

        query.where(relation, this.parent.getKey());
        query.lock(`where.${relation}`);

        return query;
    }

    get() {
        return this.query().first();
    }


    async associate(item: Model) {
        if (!isModel(item)) {
            throw new NotModelException('BelongsTo.associate()');
        }

        if (item.getType() !== this.getRelated().getSchemaName()) {
            throw new ModelInvalidRelatedTypeException('BelongsTo.associate()', this.getRelated().getSchemaName(), item.getType());
        }

        if (!item.exists) {
            throw new ModelNotPersistedException(this.getRelated().getSchemaName(), 'save');
        }

        return this.parent.update({
            [this.getForeignKey() as string]: item.getKey(),
        });
    }

    dissociate() {
        return this.parent.update({
            [this.getForeignKey() as string]: null,
        });
    }


}

