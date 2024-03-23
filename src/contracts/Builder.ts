import { Unsubscribe } from 'nanoevents';
import { PropertyBag } from '..';
import { JsonObject, JsonValue, Model, ModelPaginatedLink, ModelPaginatedResponse, ModelQuery } from '../types/Model';
import { PropertyBagEventMap } from './PropertyBag';
import { AppFacades } from '../types/App';
import CollectionWithEvents from './Collection';
import { createMergedSearchParams } from '../support/searchParams';

export default class Builder {

    private bag: PropertyBag<ModelQuery>;

    constructor(
        protected facades: AppFacades,
        protected abstract: string,
        protected query: ModelQuery = {},
    ) {
        this.bag = new PropertyBag(query);
    }

    on<T extends keyof PropertyBagEventMap>(e: T, callback: PropertyBagEventMap[T]): Unsubscribe {
        return this.bag.on(e, callback);
    }


    where(key: string, value: JsonValue): this {
        if (!this.bag.has('filters')) {
            this.bag.set('filters', {});
        }

        this.bag.set(`filters.${key}`, value);

        return this;
    }

    orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): this {
        this.bag.set('order_by', `${column}:${direction}`);
        return this;
    }

    searchBy(term: string): this {
        this.bag.set('q', term);
        return this;
    }

    minified(): this {
        this.bag.set('minified', true);
        return this;
    }

    async get(page = 1, perPage = 15, replaceLinksWith?: string): Promise<ModelPaginatedResponse> {
        this.bag.set('page', page);
        this.bag.set('per_page', perPage);

        const params = (() => {
            if (typeof this.bag.get('filters') === 'object') {
                return {
                    ...this.bag.all(),
                    filters: JSON.stringify(this.bag.get('filters')),
                };
            }
            return this.bag.all();
        })();

        const { data } = await this.facades.route.call(`luminix.${this.abstract}.index`, { params });

        const Model = this.facades.repository.make(this.abstract);

        const models: Model[] = new CollectionWithEvents(
            ...data.data.map((item: JsonObject) => {
                const value = new Model(item);
                this.facades.repository.emit('fetch', {
                    class: this.abstract,
                    model: value,
                });
                value.exists = true;
                return value;
            })
        );

        if (replaceLinksWith) {
            const [base] = replaceLinksWith.split('?');
            return {
                ...data,
                data: models,
                links: {
                    first: `${base}?${createMergedSearchParams(replaceLinksWith, data.links.first).toString()}`,
                    last: `${base}?${createMergedSearchParams(replaceLinksWith, data.links.last).toString()}`,
                    next: data.links.next && `${base}?${createMergedSearchParams(replaceLinksWith, data.links.next).toString()}`,
                    prev: data.links.prev && `${base}?${createMergedSearchParams(replaceLinksWith, data.links.prev).toString()}`
                        
                },
                meta: {
                    ...data.meta,
                    links: data.meta.links.map((link: ModelPaginatedLink) => ({
                        ...link,
                        url: link.url && `${base}?${createMergedSearchParams(replaceLinksWith, link.url).toString()}`,
                    })),
                }
            };
        }

        return {
            ...data,
            data: models,
        };
    }


    async first(): Promise<Model | null> {
        const { data } = await this.get(1, 1);
        return data.length ? data[0] : null;
    }

    async find(id: string | number): Promise<Model | null> {
        const pk = this.facades.repository.schema(this.abstract).primaryKey;
        if (!pk) {
            throw new Error(`Cannot call 'Builder.find()' without a primaryKey. '${this.abstract}' must have a primary key`);
        }
        return this.where(pk, id).first();
    }


    
}

