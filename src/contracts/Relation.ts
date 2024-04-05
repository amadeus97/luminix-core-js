import { AppFacades } from '../types/App';
import { BaseModel, Model, ModelPaginatedResponse, RelationMetaData } from '../types/Model';


import NotReducibleException from '../exceptions/NotReducibleException';

import NotModelException from '../exceptions/NotModelException';
import NoInverseRelationException from '../exceptions/NoInverseRelationException';
import UnsupportedRelationException from '../exceptions/UnsupportedRelationException';
import { Unsubscribe } from 'nanoevents';
import { BuilderInterface as Builder, Scope as ScopeBase, ExtendedOperator } from '../types/Builder';
import { Collection as CollectionInterface } from '../types/Collection';
import { isCollection } from '../support/collection';
import { RelationInterface as RelationBase } from '../types/Relation';
import { JsonValue } from '../types/Support';
import { isModel } from '../support/model';

type RelationInterface = RelationBase<Model, ModelPaginatedResponse>;
type BuilderInterface = Builder<Model, ModelPaginatedResponse>;
type Scope = ScopeBase<Model, ModelPaginatedResponse>;


export default class Relation implements RelationInterface {

    private unsubscribeQuery: Unsubscribe | null = null;

    constructor(
        protected meta: RelationMetaData,
        protected facades: AppFacades,
        protected parent: BaseModel,
        protected items: Model | CollectionInterface<Model> | null = null,
    ) {
        if (items !== null && !isModel(items) && !(isCollection(items) && items.every(isModel))) {
            throw new NotModelException('Relation.constructor()', 'Model, Collection<Model> or null');
        }
    }

    guessInverseRelation(): string {
        const { relations } = this.getRelated().getSchema();

        if (typeof this.facades.model.guessInverseRelation !== 'function') {
            throw new NotReducibleException('ModelFacade');
        }

        const currentRelationType = this.getType();

        // !Reducer `guessInverseRelation`
        const inverses: { [key: string]: string[] } = this.facades.model.guessInverseRelation({
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

    set(items: Model | CollectionInterface<Model> | null)
    {
        if (items !== null && !isModel(items) && !(isCollection(items) && items.every(isModel))) {
            throw new NotModelException('Relation.set()', 'Model, Collection<Model> or null');
        }

        if (!this.items || isModel(this.items)) {
            this.items = items;
        } else if (isCollection(items)) {
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
        return this.facades.model.make(this.meta.model);
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
    
    getLoadedItems(): Model | CollectionInterface<Model> | null
    {
        return this.items;
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
