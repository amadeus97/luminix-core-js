import { isModel } from '..';
import { AppFacades } from '../types/App';
import { BaseModel, JsonValue, Model } from '../types/Model';

import { Collection } from './Collection';

export default class Relation {

    constructor(
        protected facades: AppFacades,
        protected parent: BaseModel,
        protected related: typeof Model,
        protected items: Model | Collection<Model> | null = null,
        protected foreignKey: string | null = null,
    ) {
        if (items !== null && !isModel(items) && !(items instanceof Collection && items.every(isModel))) {
            throw new Error('Relation expects null, Model or Collection of models instance');
        }
    }

    set(items: Model | Collection<Model> | null)
    {
        if (items !== null && !isModel(items) && !(items instanceof Collection && items.every(isModel))) {
            console.trace('instance of collection', (items as unknown) instanceof Collection);
            console.trace('every is model', (items as Collection<Model>).every(isModel));
            console.trace('items', items);
            console.trace('item body', (items[0] as Model).body);
            throw new Error(`Relation '${this.getName()}' expects null, Model or Collection of models instance. Got ${typeof items} instead.`);
        }

        if (!this.items || isModel(this.items)) {
            this.items = items;
        } else if (items instanceof Collection) {
            this.items.flush().push(...items);
        }
    }

    getName()
    {
        const relation = Object.entries(this.parent.relations).find(([, relation]) => relation === this);

        if (!relation) {
            throw new Error('Relation not found in parent model');
        }

        return relation[0];
    }

    query()
    {
        const query = this.related.query();

        query.once('success', (e) => {
            this.items = e.items;
        });

        return query;
    }

    isLoaded(): boolean
    {
        return this.items !== null;
    }
    
    getLoadedItems(): Model | Collection<Model> | null
    {
        return this.items;
    }

    getParent(): BaseModel
    {
        return this.parent;
    }

    where(key: string, value: JsonValue)
    {
        return this.query().where(key, value);
    }

    orderBy(column: string, direction: 'asc' | 'desc' = 'asc')
    {
        return this.query().orderBy(column, direction);
    }

    searchBy(term: string)
    {
        return this.query().searchBy(term);
    }

    minified()
    {
        return this.query().minified();
    }

    // get(page = 1, perPage = 15, replaceLinksWith?: string): Promise<ModelPaginatedResponse>
    // {
    //     return this.query().get(page, perPage, replaceLinksWith);
    // }

    // first(): Promise<Model | null>
    // {
    //     return this.query().first();
    // }

    // find(id: string | number): Promise<Model | null>
    // {
    //     return this.query().find(id);
    // }
}
