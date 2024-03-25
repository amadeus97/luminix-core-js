import ModelInvalidRelatedTypeException from '../../exceptions/ModelInvalidRelatedTypeException';
import NotModelException from '../../exceptions/NotModelException';
import { isModel } from '../../mixins/BaseModel';
import { AppFacades } from '../../types/App';
import { Model, RelationMetaData } from '../../types/Model';
import CollectionWithEvents, { Collection } from '../Collection';
import HasOneOrMany from './HasOneOrMany';


export default class HasMany extends HasOneOrMany
{

    constructor(
        protected meta: RelationMetaData,
        protected facades: AppFacades,
        protected parent: Model,
        protected items: Collection<Model> | null = null,
    ) {
        if (items !== null && !(items instanceof CollectionWithEvents && items.every(isModel))) {
            throw new NotModelException('HasMany.constructor()', 'Collection<Model> or null');
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

        const newItems = await this.all();

        if (this.items) {
            this.items.flush().push(...newItems);
        } else {
            this.items = newItems;
        }
    }

    async save(item: Model) {
        await this.saveQuietly(item);

        if (this.items === null) {
            this.items = new CollectionWithEvents(
                ...(await this.query().all())
            );
        } else {
            this.items.push(item);
        }
    }
}
