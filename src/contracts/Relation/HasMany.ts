import { isModel } from '../../mixins/BaseModel';
import { AppFacades } from '../../types/App';
import { Model } from '../../types/Model';
import CollectionWithEvents, { Collection } from '../Collection';
import HasOneOrMany from './HasOneOrMany';


export default class HasMany extends HasOneOrMany
{

    constructor(
        protected facades: AppFacades,
        protected parent: Model,
        protected related: typeof Model,
        protected items: Collection<Model> | null = null,
        protected foreignKey: string | null = null,
    ) {
        if (items !== null && !(items instanceof CollectionWithEvents && items.every(isModel))) {
            throw new Error('HasMany expects null or Collection of models instance');
        }
        super(facades, parent, related, items, foreignKey);
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
            throw new Error('saveManyQuietly expects an array of models');
        }

        if (!models.every((model) => model.getType() === this.related.getSchemaName())) {
            throw new Error('saveManyQuietly expects an array of models of the same type');
        }

        await Promise.all(models.map((model) => {
            model.setAttribute(this.foreignKey as string, this.parent.getKey());
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
