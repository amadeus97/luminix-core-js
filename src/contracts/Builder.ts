import { Unsubscribe } from 'nanoevents';

import PropertyBag from './PropertyBag';
import CollectionWithEvents, { Collection } from './Collection';

import { HasEvents } from '../mixins/HasEvents';
import { createMergedSearchParams } from '../support/searchParams';

import { AppFacades } from '../types/App';
import { BuilderEventMap, BuilderInterface, Scope } from '../types/Builder';
import { EventData } from '../types/Event';
import {
    JsonObject, JsonValue, Model, ModelPaginatedLink,
    ModelPaginatedResponse, ModelQuery
} from '../types/Model';
import MethodNotImplementedException from '../exceptions/MethodNotImplementedException';
import ModelWithoutPrimaryKeyException from '../exceptions/ModelWithoutPrimaryKeyException';
import _ from 'lodash';
import { Operator } from '../types/Collection';

const QueryBag = HasEvents<BuilderEventMap, typeof PropertyBag<ModelQuery>>(PropertyBag);

class Builder implements BuilderInterface {

    private bag: PropertyBag<ModelQuery>;

    constructor(
        protected facades: AppFacades,
        protected abstract: string,
        protected query: ModelQuery = {},
    ) {
        this.bag = new QueryBag(query);
        this.bag.on('change', () => {
            this.emit('change', {
                data: this.bag,
            });
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    on<T extends keyof BuilderEventMap>(_: T, __: BuilderEventMap[T]): Unsubscribe {
        throw new MethodNotImplementedException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    once<T extends keyof BuilderEventMap>(_: T, __: BuilderEventMap[T]): void {
        throw new MethodNotImplementedException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    emit<T extends keyof BuilderEventMap>(_: T, __: EventData<BuilderEventMap, T>): void {
        throw new MethodNotImplementedException();
    }

    lock(path: string): void {
        this.bag.lock(path);
    }

    whereBetween(key: string, value: [JsonValue, JsonValue]): this {
        if (!this.bag.has('filters')) {
            this.bag.set('filters', {});
        }
        this.bag.set(`filters.${_.camelCase(key)}Between`, value);
        return this;
    }

    whereNotBetween(key: string, value: [JsonValue, JsonValue]): this {
        if (!this.bag.has('filters')) {
            this.bag.set('filters', {});
        }
        this.bag.set(`filters.${_.camelCase(key)}NotBetween`, value);
        return this;
    }

    whereNull(key: string): this {
        if (!this.bag.has('filters')) {
            this.bag.set('filters', {});
        }
        this.bag.set(`filters.${_.camelCase(key)}Null`, true);
        return this;
    }

    whereNotNull(key: string): this {
        if (!this.bag.has('filters')) {
            this.bag.set('filters', {});
        }
        this.bag.set(`filters.${_.camelCase(key)}NotNull`, true);
        return this;
    }

    where(scope: (builder: BuilderInterface) => BuilderInterface | void): this;
    where(key: string, value: JsonValue): this;
    where(key: string, operator: Operator, value: JsonValue): this;
    where(key: string | Scope, operatorOrValue?: Operator | JsonValue, value?: JsonValue): BuilderInterface {
        if (!this.bag.has('filters')) {
            this.bag.set('filters', {});
        }
        
        if (typeof key === 'function') {
            const query = key(this);
            return query || this as BuilderInterface;
        }

        if (typeof value === 'undefined') {
            this.bag.set(`filters.${_.camelCase(key)}`, operatorOrValue);
            return this;
        }

        const operatorSuffixMap: Record<Operator & 'like', string> = {
            '=': '',
            '!=': 'NotEquals',
            '>': 'GreaterThan',
            '>=': 'GreaterThanOrEquals',
            '<': 'LessThan',
            '<=': 'LessThanOrEquals',
            'like': 'Like',
        };

        if (typeof operatorOrValue !== 'string' || !(operatorOrValue in operatorSuffixMap)) {
            throw new Error(`Invalid operator: ${operatorOrValue}`);
        }

        const suffix: string = operatorSuffixMap[operatorOrValue as Operator & 'like'];

        this.bag.set(`filters.${_.camelCase(key)}${suffix}`, value);

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

    private async exec(page = 1, perPage = 15, replaceLinksWith?: string): Promise<ModelPaginatedResponse> {
        try {
            this.bag.set('page', page);
            this.bag.set('per_page', perPage);
    
            // const params = (() => {
            //     if (typeof this.bag.get('filters') === 'object') {
            //         return {
            //             ...this.bag.all(),
            //             filters: JSON.stringify(this.bag.get('filters')),
            //         };
            //     }
            //     return this.bag.all();
            // })();
    
            this.emit('submit', {
                data: this.bag,
            });
    
            const { data } = await this.facades.route.call(`luminix.${this.abstract}.index`, { params: this.bag.all() });
    
            const Model = this.facades.model.make(this.abstract);
    
            const models: Model[] = new CollectionWithEvents(
                ...data.data.map((item: JsonObject) => {
                    const value = new Model(item);
                    value.exists = true;

                    this.facades.model.emit('fetch', {
                        class: this.abstract,
                        model: value,
                    });

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
        } catch (error) {
            this.emit('error', {
                error,
            });
            throw error;
        }
    }

    async get(page = 1, perPage = 15, replaceLinksWith?: string): Promise<ModelPaginatedResponse> {
        const result = await this.exec(page, perPage, replaceLinksWith);
        this.emit('success', {
            response: result,
            items: result.data,
        });
        return result;
    }


    async first(): Promise<Model | null> {
        const result = await this.exec(1, 1);

        this.emit('success', {
            response: result,
            items: result.data.length ? result.data[0] : null,
        });

        return result.data.length ? result.data[0] : null;
    }

    async find(id: string | number): Promise<Model | null> {
        const pk = this.facades.model.schema(this.abstract).primaryKey;
        if (!pk) {
            throw new ModelWithoutPrimaryKeyException(this.abstract);
        }

        const result = await this.where(pk, id).exec(1, 1);

        this.emit('success', {
            response: result,
            items: result.data.length ? result.data[0] : null,
        });

        return result.data.length ? result.data[0] : null;
    }

    async all(): Promise<Collection<Model>> {
        const firstPage = await this.exec(1, this.facades.config.get('luminix.backend.api.max_per_page', 150) as number);

        const pages = firstPage.meta.last_page;

        if (pages === 1) {
            return firstPage.data;
        }

        const pagesToFetch = Array.from({ length: pages - 1 }, (_, i) => i + 2);

        const results = await Promise.all(
            pagesToFetch.map((page) => this.exec(page, this.facades.config.get('luminix.backend.api.max_per_page', 150) as number))
        );

        const all = new CollectionWithEvents(
            ...results.reduce((acc, result) => {
                acc.push(...result.data);
                return acc;
            }, firstPage.data)
        );

        this.emit('success', {
            response: {
                ...firstPage,
                data: all,
            },
            items: all,
        });

        return all;
    }


    
}


export default HasEvents<BuilderEventMap, typeof Builder>(Builder);
