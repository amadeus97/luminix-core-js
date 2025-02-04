import { Collection, Obj } from '@luminix/support';

import { Model, RelationMetaData } from '../../types/Model';

import MorphOneOrMany from './MorphOneOrMany';

import NotModelException from '../../exceptions/NotModelException';
import ModelInvalidRelatedTypeException from '../../exceptions/ModelInvalidRelatedTypeException';
import { RelationServices } from '../Relation';


export default class MorphMany extends MorphOneOrMany
{
    constructor(
        protected services: RelationServices,
        protected meta: RelationMetaData,
        protected parent: Model,
        protected items: Collection<Model> | null = null,
    ) {
        if (items !== null && !(items instanceof Collection && items.every(Obj.isModel))) {
            throw new NotModelException('MorphMany.constructor()', 'Collection<Model> or null');
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
            throw new NotModelException('MorphMany.saveManyQuietly()');
        }

        if (!models.every((model) => model.getType() === this.getRelated().getSchemaName())) {
            throw new ModelInvalidRelatedTypeException('MorphMany.saveManyQuietly()', this.getRelated().getSchemaName(), models.map((model) => model.getType()).join(', '));
        }

        await Promise.all(models.map((model) => {
            model.setAttribute(this.getName() + '_id', this.parent.getKey());
            model.setAttribute(this.getName() + '_type', this.parent.getType());
            return model.save();
        }));
    }

    async saveMany(models: Model[])
    {
        await this.saveManyQuietly(models);

        const newItems = await this.all();

        if (this.items) {
            this.items.splice(0, this.items.count(), ...newItems);
        } else {
            this.items = newItems;
        }
    }

    async save(item: Model)
    {
        await this.saveQuietly(item);

        if (this.items) {
            this.items.push(item);
        } else {
            this.items = await this.all();
        }
    }

}
