import { Collection, Obj } from '@luminix/support';

import ModelInvalidRelatedTypeException from '../../exceptions/ModelInvalidRelatedTypeException';
import NotModelException from '../../exceptions/NotModelException';

import { Model, RelationMetaData } from '../../types/Model';

import HasOneOrMany from './HasOneOrMany';
import { RelationServices } from '../Relation';
import collect from '../../helpers/collect';

export default class HasMany extends HasOneOrMany
{

    constructor(
        protected services: RelationServices,
        protected meta: RelationMetaData,
        protected parent: Model,
        protected items: Collection<Model> | null = null,
    ) {
        if (items !== null && !(items instanceof Collection && items.every(Obj.isModel))) {
            throw new NotModelException('HasMany.constructor()', 'Collection<Model> or null');
        }
        super(services, meta, parent, items);
    }

    isSingle(): boolean {
        return false;
    }

    isMultiple(): boolean {
        return true;
    }

    get(page = 1, replaceLinksWith?: string)
    {
        return this.query().get(page, replaceLinksWith);
    }

    all()
    {
        return this.query().all();
    }

    first()
    {
        return this.query().first();
    }

    find(id: string | number)
    {
        return this.query().find(id);
    }

    async saveManyQuietly(models: Model[])
    {
        if (!Array.isArray(models) || !models.every(Obj.isModel)) {
            throw new NotModelException('HasMany.saveManyQuietly()', 'Model[]');
        }

        if (!models.every((model) => model.getType() === this.getRelated().getSchemaName())) {
            throw new ModelInvalidRelatedTypeException('HasMany.saveManyQuietly()', this.getRelated().getSchemaName(), models.map((model) => model.getType()).join(', '));
        }

        await Promise.all(models.map((model) => {
            model.setAttribute(this.getForeignKey() as string, this.parent.getKey());
            return model.save();
        }));
    }

    async saveMany(models: Model[])
    {
        await this.saveManyQuietly(models);

        if (this.items) {
            this.items.splice(0, this.items.count(), ...models);
        } else {
            this.items = collect(models);
        }
    }

    async save(item: Model) {
        await this.saveQuietly(item);

        if (this.items === null) {
            this.items = collect([item]);
        } else {
            this.items.push(item);
        }
    }
    
}
