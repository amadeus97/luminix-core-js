import { isModel } from '..';
import { AppFacades } from '../types/App';
import { JsonValue, Model, ModelPaginatedResponse } from '../types/Model';

import { Collection } from './Collection';

export default class Relation {

    constructor(
        protected facades: AppFacades,
        protected parent: Model,
        protected related: typeof Model,
        protected items: Model | Collection<Model> | null = null
    ) {
        if (items !== null && !isModel(items) && !(items instanceof Collection && items.every(isModel))) {
            throw new Error('Relation expects null, Model or Collection of models instance');
        }
    }

    getName()
    {
        return Object.entries(this.parent.relations).find(([, relation]) => relation === this)[0];
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

    getParent(): Model
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
