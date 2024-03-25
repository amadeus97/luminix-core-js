import { AppFacades } from '../../types/App';
import { Model, RelationMetaData } from '../../types/Model';
import { isModel } from '../../mixins/BaseModel';

import MorphOneOrMany from './MorphOneOrMany';

import CollectionWithEvents, { Collection } from '../Collection';
import NotModelException from '../../exceptions/NotModelException';
import ModelInvalidRelatedTypeException from '../../exceptions/ModelInvalidRelatedTypeException';


export default class MorphMany extends MorphOneOrMany
{
    constructor(
        protected meta: RelationMetaData,
        protected facades: AppFacades,
        protected parent: Model,
        protected items: Collection<Model> | null = null,
    ) {
        if (items !== null && !(items instanceof CollectionWithEvents && items.every(isModel))) {
            throw new NotModelException('MorphMany.constructor()', 'Collection<Model> or null');
        }
        super(meta, facades, parent, items);
    }

    get(page = 1, perPage = 15, replaceLinksWith?: string)
    {
        return this.query().get(page, perPage, replaceLinksWith);
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
        if (!Array.isArray(models) || !models.every(isModel)) {
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

    async save(item: Model)
    {
        await this.saveQuietly(item);

        if (this.items) {
            this.items.push(item);
        } else {
            this.items = new CollectionWithEvents(
                ...(await this.all())
            );
        }
    }

    async saveMany(models: Model[])
    {
        await this.saveManyQuietly(models);

        const newItems = await this.all();

        if (this.items) {
            this.items.flush().push(...newItems);
        } else {
            this.items = new CollectionWithEvents(
                ...newItems
            );
        }
    }

}