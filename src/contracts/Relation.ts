import { Collection, JsonObject, JsonValue } from '@luminix/support';

import { BaseModel, Model, ModelPaginatedResponse, RelationMetaData } from '../types/Model';

import NotModelException from '../exceptions/NotModelException';
import NoInverseRelationException from '../exceptions/NoInverseRelationException';
import UnsupportedRelationException from '../exceptions/UnsupportedRelationException';

import { BuilderInterface as Builder, Scope as ScopeBase, ExtendedOperator } from '../types/Builder';

import { RelationInterface as RelationBase } from '../types/Relation';

import { isModel } from '../support/model';
import { ModelFacade } from '../types/App';
import { RouteFacade } from '../types/Route';


type RelationInterface = RelationBase<Model, ModelPaginatedResponse>;
type BuilderInterface = Builder<Model, ModelPaginatedResponse>;
type Scope = ScopeBase<Model, ModelPaginatedResponse>;


export default class Relation implements RelationInterface {

    private unsubscribeQuery: (() => void) | null = null;

    constructor(
        protected model: ModelFacade,
        protected route: RouteFacade,
        protected meta: RelationMetaData,
        protected parent: BaseModel,
        protected items: Model | Collection<Model> | null = null,
    ) {
        if (items !== null && !isModel(items) && !(items instanceof Collection && items.every(isModel))) {
            throw new NotModelException('Relation.constructor()', 'Model, Collection<Model> or null');
        }
    }

    make(data: JsonValue): void {
        const Model = this.getRelated();

        if (data === null || typeof data === 'undefined') {
            this.set(null);
            return;
        }

        if (this.isSingle()) {
            if (typeof data !== 'object' || Array.isArray(data)) {
                throw new TypeError('Relation.make() expects an object');
            }
            this.set(new Model(data));
        }

        if (this.isMultiple()) {
            if (!Array.isArray(data)) {
                throw new TypeError('Relation.make() expects an array');
            }
            this.set(new Collection(data.map((item) => new Model(item as JsonObject))));
        }
    }

    guessInverseRelation(): string {
        const { relations } = this.getRelated().getSchema();

        const currentRelationType = this.getType();

        // !Reducer `guessInverseRelation`
        const inverses: { [key: string]: string[] } = this.model.guessInverseRelation({
            'HasOne': ['BelongsTo'],
            'HasMany': ['BelongsTo'],
            'BelongsTo': ['HasOne', 'HasMany'],
            'BelongsToMany': ['BelongsToMany'],
            'MorphTo': ['MorphMany', 'MorphOne'],
            'MorphOne': ['MorphTo'],
            'MorphMany': ['MorphTo'],
            'MorphToMany': ['MorphToMany'],
        }, this.parent, currentRelationType, this.getRelated());

        if (!(currentRelationType in inverses)) {
            throw new UnsupportedRelationException(currentRelationType);
        }

        for (const relationName in relations) {
            const relation = relations[relationName];

            if ((relation.model === this.parent.getType() || ['MorphOne', 'MorphMany'].includes(currentRelationType)) && inverses[currentRelationType].includes(relation.type)) {
                return relationName;
            }
        }

        throw new NoInverseRelationException(this.parent.getType(), currentRelationType, this.getRelated().getSchemaName(), inverses[currentRelationType].join(' or '));
    }

    set(items: Model | Collection<Model> | null)
    {
        if (items !== null && !isModel(items) && !(items instanceof Collection && items.every(isModel))) {
            throw new NotModelException('Relation.set()', 'Model, Collection<Model> or null');
        }

        if (!this.items || isModel(this.items)) {
            this.items = items;
        } else if (items instanceof Collection) {
            this.items.splice(0, this.items.count(), ...items);
        }
    }

    getForeignKey() {
        return this.meta.foreignKey;
    }

    getName()
    {
        return this.meta.name;
    }

    getType()
    {
        return this.meta.type;
    }

    getModel()
    {
        return this.meta.model;
    }

    getRelated()
    {
        return this.model.make(this.meta.model);
    }

    query()
    {
        const query = this.getRelated().query();

        if (this.unsubscribeQuery) {
            this.unsubscribeQuery();
        }

        this.unsubscribeQuery = query.on('success', (e) => {
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

    isSingle(): boolean
    {
        return isModel(this.items);
    }

    isMultiple(): boolean
    {
        return this.items instanceof Collection;
    }

    getParent()
    {
        return this.parent;
    }

    where(scope: Scope): BuilderInterface
    where(key: string, value: JsonValue): BuilderInterface
    where(key: string, operator: ExtendedOperator, value: JsonValue): BuilderInterface
    where(...args: unknown[])
    {
        return this.query().where(...args as [string, ExtendedOperator, JsonValue]);
    }

    whereNull(key: string)
    {
        return this.query().whereNull(key);
    }

    whereNotNull(key: string)
    {
        return this.query().whereNotNull(key);
    }

    whereBetween(key: string, value: [JsonValue, JsonValue])
    {
        return this.query().whereBetween(key, value);
    }

    whereNotBetween(key: string, value: [JsonValue, JsonValue])
    {
        return this.query().whereNotBetween(key, value);
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

    limit(value: number)
    {
        return this.query().limit(value);
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
