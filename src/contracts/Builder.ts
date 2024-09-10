

import {
    PropertyBag, Collection, EventSource, Query,
    JsonValue
} from '@luminix/support';

import {
    BuilderEventMap as BuilderEvents, BuilderInterface as BuilderBase, Scope as ScopeBase,
    ExtendedOperator
} from '../types/Builder';
// import { EventData } from '../types/Event';
import {
    Model, ModelPaginatedLink,
    ModelPaginatedResponse, ModelQuery,
    ModelRawPaginatedResponse
} from '../types/Model';

import ModelWithoutPrimaryKeyException from '../exceptions/ModelWithoutPrimaryKeyException';
import { ModelFacade } from '../types/App';
import { RouteFacade } from '../types/Route';
import { ConfigFacade } from '../types/Config';

// import ModelFacade from '../facades/Model';
// import Route from '../facades/Route';
// import Config from '../facades/Config';

type BuilderInterface = BuilderBase<Model, ModelPaginatedResponse>;
type BuilderEventMap = BuilderEvents<Model, ModelPaginatedResponse>;
type Scope = ScopeBase<Model, ModelPaginatedResponse>;

class Builder extends EventSource<BuilderEventMap> implements BuilderInterface {

    private bag: PropertyBag<ModelQuery>;

    constructor(
        protected services: { config: ConfigFacade, model: ModelFacade, route: RouteFacade },
        protected abstract: string,
        protected query: ModelQuery = {},
    ) {
        super();
        this.bag = new PropertyBag(query);
        this.bag.on('change', () => {
            this.emit('change', {
                data: this.bag,
                source: this
            });
        });
    }

    lock(path: string): void {
        this.bag.lock(path);
    }

    whereBetween(key: string, value: [JsonValue, JsonValue]): this {
        return this.where(key, 'between', value as JsonValue);
    }

    whereNotBetween(key: string, value: [JsonValue, JsonValue]): this {
        return this.where(key, 'notBetween', value as JsonValue);
    }

    whereNull(key: string): this {
        return this.where(key, 'null', null);
    }

    whereNotNull(key: string): this {
        return this.where(key, 'notNull', null);
    }

    limit(value: number): this {
        this.bag.set('per_page', value);
        return this;
    }

    where(scope: (builder: BuilderInterface) => BuilderInterface | void): this;
    where(key: string, value: JsonValue): this;
    where(key: string, operator: ExtendedOperator, value: JsonValue): this;
    where(key: string | Scope, operatorOrValue?: ExtendedOperator | JsonValue, value?: JsonValue): BuilderInterface {
        if (!this.bag.has('where')) {
            this.bag.set('where', {});
        }
        
        if (typeof key === 'function') {
            const query = key(this);
            return query || this as BuilderInterface;
        }

        if (typeof value === 'undefined') {
            this.bag.set(`where.${key}`, operatorOrValue);
            return this;
        }

        if (typeof operatorOrValue !== 'string') {
            throw new Error(`Invalid operator ${operatorOrValue} provided for where clause.`);
        }

        const operatorSuffixMap: Record<string, string> = {
            '=': '',
            '!=': 'notEquals',
            '>': 'greaterThan',
            '>=': 'greaterThanOrEquals',
            '<': 'lessThan',
            '<=': 'lessThanOrEquals',
        };

        const suffix: string = operatorSuffixMap[operatorOrValue] || operatorOrValue;

        this.bag.set(`where.${key}:${suffix}`, value);

        return this;
    }

    with(relation: string | string[]): this {
        const relations: string[] = this.bag.get('with', []) as string[];

        const include = Array.isArray(relation) ? relation : [relation];

        include.forEach((relation) => {
            if (!relations.includes(relation)) {
                relations.push(relation);
            }
        });

        this.bag.set('with', relations);

        return this;
    }

    withOnly(relation: string | string[]): this {

        this.bag.set('with', Array.isArray(relation) ? relation : [relation]);

        return this;
    }

    without(relation: string | string[]): this {
        
        const relations: string[] = this.bag.get('with', []) as string[];

        const exclude = Array.isArray(relation) ? relation : [relation];

        exclude.forEach((relation) => {
            if (relations.includes(relation)) {
                relations.splice(relations.indexOf(relation), 1);
            }
        });

        this.bag.set('with', relations);

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

    unset(key: string): this {
        this.bag.delete(key);
        return this;
    }

    include(searchParams: URLSearchParams): this {

        for (const [key, value] of searchParams.entries()) {
            this.bag.set(key, value);
        }
        
        return this;
    }

    private async exec(page = 1, replaceLinksWith?: string): Promise<ModelPaginatedResponse> {
        try {
            this.bag.set('page', page);            
    
            this.emit('submit', {
                data: this.bag,
                source: this,
            });
    
            const response = await this.services.route.call<ModelRawPaginatedResponse>(
                `luminix.${this.abstract}.index`,
                (client) => client.withQueryParameters(this.bag.all())
            );
            /*{
                params: this.bag.all(),
                errorBag: `${this.abstract}.fetch`,
            });*/
    
            const Model = this.services.model.make(this.abstract);
    
            // const models = new Collection(
            //     ...data.data.map((item: JsonObject) => {
            //         const value = new Model(item);
            //         value.exists = true;

            //         ModelFacade.emit('fetch', {
            //             class: this.abstract,
            //             model: value,
            //         });

            //         return value;
            //     })
            // );
            const models = new Collection<Model>(response.json('data').map((item) => {
                const value = new Model(item);
                value.exists = true;

                this.services.model.emit('fetch', {
                    class: this.abstract,
                    model: value,
                    source: this.services.model,
                });

                return value;
            }));

    
            if (replaceLinksWith) {
                const [base] = replaceLinksWith.split('?');
                return {
                    ...response.json(),
                    data: models,
                    links: {
                        first: `${base}?${Query.merge(replaceLinksWith, response.json('links').first).toString()}`,
                        last: `${base}?${Query.merge(replaceLinksWith, response.json('links').last).toString()}`,
                        next: response.json('links').next && `${base}?${Query.merge(replaceLinksWith, response.json('links').next ?? '').toString()}`,
                        prev: response.json('links').prev && `${base}?${Query.merge(replaceLinksWith, response.json('links').prev ?? '').toString()}`
                    },
                    meta: {
                        ...response.json('meta'),
                        links: response.json('meta').links.map((link: ModelPaginatedLink) => ({
                            ...link,
                            url: link.url && `${base}?${Query.merge(replaceLinksWith, link.url).toString()}`,
                        })),
                    }
                };
            }
    
            return {
                ...response.json(),
                data: models,
            };
        } catch (error) {
            this.emit('error', {
                error,
                source: this,
            });
            throw error;
        }
    }

    async get(page = 1, replaceLinksWith?: string): Promise<ModelPaginatedResponse> {
        const result = await this.exec(page, replaceLinksWith);
        this.emit('success', {
            response: result,
            items: result.data,
            source: this,
        });
        return result;
    }


    async first(): Promise<Model | null> {
        const result = await this.limit(1).exec(1);

        this.emit('success', {
            response: result,
            items: result.data.first(),
            source: this,
        });

        return result.data.first();
    }

    async find(id: string | number): Promise<Model | null> {
        const pk = this.services.model.schema(this.abstract).primaryKey;
        if (!pk) {
            throw new ModelWithoutPrimaryKeyException(this.abstract);
        }

        const result = await this.where(pk, id).limit(1).exec(1);

        this.emit('success', {
            response: result,
            items: result.data.sole(),
            source: this,
        });

        return result.data.sole();
    }

    async all(): Promise<Collection<Model>> {
        const limit = this.services.config.get('luminix.backend.api.max_per_page', 150) as number;
        const firstPage = await this.limit(limit).exec(1);

        const pages = firstPage.meta.last_page;

        if (pages === 1) {
            return firstPage.data;
        }

        // [2, 3, 4, ..., N]
        const pagesToFetch = Array.from({ length: pages - 1 }, (_, i) => i + 2);

        const results = await Promise.all(
            pagesToFetch.map((page) => this.limit(limit).exec(page))
        );

        // const all = new Collection(
        //     ...results.reduce((acc, result) => {
        //         acc.push(...result.data);
        //         return acc;
        //     }, firstPage.data).all()
        // );

        const all = new Collection<Model>(
            results.reduce((acc, result) => {
                acc.push(...result.data);
                return acc;
            }, firstPage.data).all()
        );

        this.emit('success', {
            response: {
                ...firstPage,
                data: all,
            },
            items: all,
            source: this,
        });

        return all;
    }

    
}


export default Builder;
