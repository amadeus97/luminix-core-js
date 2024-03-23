
import _ from 'lodash';
import PropertyBag from '../contracts/PropertyBag';

import { 
    BaseModel, JsonObject, ModelSaveOptions, ModelSchemaAttributes,
    ModelPaginatedResponse, Model, RelationRepository, ModelEvents,
    JsonValue,
} from '../types/Model';

import { AppFacades } from '../types/App';
import { RouteGenerator, RouteReplacer } from '../types/Route';
import { AxiosResponse } from 'axios';
import { HasEvents } from './HasEvents';
import { Unsubscribe } from 'nanoevents';
import CollectionWithEvents from '../contracts/Collection';

import Builder from '../contracts/Builder';


export function BaseModelFactory(facades: AppFacades, abstract: string): typeof BaseModel {

    class ModelRaw {

        private _attributes: PropertyBag<JsonObject> = new PropertyBag({});
        private _original: JsonObject = {};
        private _relations: RelationRepository = {};
        private _changedKeys: string[] = [];
        
        public exists = false;

        constructor(attributes: JsonObject = {}) {
            this.makeAttributes(attributes);

        }
    
        private cast(value: unknown, cast: string) {
            if (value === null || value === undefined || !cast) {
                return value;
            }
    
            if (['boolean', 'bool'].includes(cast)) {
                return !!value;
            }
            if (['date', 'datetime', 'immutable_date', 'immutable_datetime'].includes(cast) && typeof value === 'string') {
                return new Date(value);
            }
            if (
                ['float', 'double', 'integer', 'int'].includes(cast)
                || cast.startsWith('decimal:')
            ) {
                return Number(value);
            }
    
            return value;
        }
    
        private mutate(value: unknown, mutator: string) {
            if (value === null || value === undefined || !mutator) {
                return value;
            }
            if (['boolean', 'bool'].includes(mutator)) {
                return !!value;
            }
            if (['date', 'datetime', 'immutable_date', 'immutable_datetime'].includes(mutator) && value instanceof Date) {
                return value.toISOString();
            }
            if (
                ['float', 'double', 'integer', 'int'].includes(mutator)
                || mutator.startsWith('decimal:')
            ) {
                return Number(value);
            }
    
            return value;
        }
    
        private makeAttributes(attributes: JsonObject)
        {
            const { relations } = facades.repository.schema(abstract);
    
            // remove relations from attributes
            const excludedKeys = Object.keys(relations || {});
            const newAttributes: JsonObject = _.omit(attributes, excludedKeys);
    
            // fill missing fillable attributes with null
            this.fillable.filter((key) => !(key in newAttributes)).forEach((key) => {
                newAttributes[key] = null;
            });
    
            const newRelations: RelationRepository = {};
    
            if (relations) {
                Object.entries(relations).forEach(([key, relation]) => {
                    const { type, model } = relation;
    
                    if (type === 'MorphTo' && !attributes[`${key}_type`]) {
                        return;
                    }
    
                    const Model = facades.repository.make(
                        type === 'MorphTo'
                            ? attributes[`${key}_type`] as string
                            : model
                    );
    
                    const relationData = attributes[key];
                    const isSingle = ['BelongsTo', 'MorphOne', 'MorphTo'].includes(type);
    
                    if (isSingle && typeof relationData === 'object' && relationData !== null) {
                        newRelations[key] = new Model(relationData as JsonObject);
                    }
    
                    if (!isSingle && Array.isArray(attributes[key])) {
                        newRelations[key] = new CollectionWithEvents(
                            ...(attributes[key] as JsonObject[]).map((item) => new Model(item))
                        );
                    }
                });
            }

            if (!this.validateJsonObject(newAttributes)) {
                if (facades.config.get('app.env', 'production') === 'production') {
                    throw new TypeError(`[Luminix] Invalid attributes for model "${abstract}"`);
                } else {
                    facades.log.warning(`Invalid attributes for model "${abstract}".
                        This will throw an error in production.`, {
                        attributes, abstract
                    });
                }
            }

            this._attributes = new PropertyBag(newAttributes);
            this._original = newAttributes;
            this._relations = newRelations;
            this._changedKeys = [];
        }
    
        private makePrimaryKeyReplacer(): RouteReplacer {
            return {
                [this.primaryKey]: this.getAttribute(this.primaryKey) as string
            };
        }
    
        private dispatchChangeEvent(change: JsonObject) {
            this.emit('change', {
                value: change,
            });
        }
    
        private dispatchCreateEvent(attributes: JsonObject) {
            this.emit('create', {
                value: attributes,
            });
    
            facades.repository.emit('create', {
                class: abstract,
                model: this,
            });
        }
    
        private dispatchUpdateEvent(attributes: JsonObject) {
            this.emit('update', {
                value: attributes,
            });
    
            facades.repository.emit('update', {
                class: abstract,
                model: this,
            });
        }
    
        private dispatchSaveEvent() {
            this.emit('save', {
                value: this.diff(),
            });
    
            facades.repository.emit('save', {
                class: abstract,
                model: this,
            });
        }
    
        private dispatchDeleteEvent(force = false) {
            this.emit('delete', {
                force,
                [this.getKeyName()]: this.getKey(),
            });
    
            facades.repository.emit('delete', {
                class: abstract,
                model: this,
                force,
            });
        }
    
        private dispatchRestoreEvent() {
            this.emit('restore', {
                value: this.attributes,
            });
    
            facades.repository.emit('restore', {
                class: abstract,
                model: this,
            });
        }
    
        private dispatchErrorEvent(error: unknown, operation: 'save' | 'delete' | 'restore' | 'forceDelete') {
            this.emit('error', {
                error,
                operation,
            });
    
            facades.repository.emit('error', {
                class: abstract,
                model: this,
                error,
                operation,
            });
        }
    
        private validateJsonObject(json: unknown): json is JsonObject {
            if (typeof json !== 'object' || json === null) {
                return false;
            }
            return Object.entries(json).every(([, value]) => {
                return ['boolean', 'number', 'string'].includes(typeof value) 
                    || value === null 
                    || this.validateJsonObject(value)
                    || (Array.isArray(value) && value.every((item) => this.validateJsonObject(item)));
            });
        }

        // private createQueryForRelation(relation: string): Builder {
        //     const { relations } = facades.repository.schema(abstract);
        //     const { model, type } = relations[relation];
    
        //     const { relations: relatedRelations } = facades.repository.schema(model);

        //     const query = new Builder(facades, model);

        //     const findRelatedRelation = (relationType: string) => {
        //         const relatedRelation = Object.entries(relatedRelations).find(([, value]) => {
        //             return value.model === abstract && value.type === relationType;
        //         });
        //         if (!relatedRelation) {
        //             throw new Error(`[Luminix] Cannot find relation for model "${abstract}" in model "${model}"`);
        //         }
        //         return relatedRelation[0];
        //     };

        //     if (type === 'BelongsTo') {
        //         const relatedKey = findRelatedRelation('HasOne') || findRelatedRelation('HasMany');
        //         query.where(relatedKey, this.getKey());
        //         query.lock(relatedKey);
        //     } else if (type === 'BelongsToMany') {
        //         const relatedKey = findRelatedRelation('BelongsToMany');
        //         query.where(relatedKey, this.getKey());
        //         query.lock(relatedKey);
        //     } else if (['HasOne', 'HasMany'].includes(type)) {
        //         const relatedKey = findRelatedRelation('BelongsTo');
        //         query.where(relatedKey, this.getKey());
        //         query.lock(relatedKey);
        //     } else if (type === 'MorphTo') {

        //     }
        
        //     return query;
        // }
    
        get attributes() {
            return this._attributes.all();
        }
    
        get original() {
            return this._original;
        }
    
        get relations() {
            return this._relations;
        }
    
        get fillable() {
            return facades.repository.schema(abstract).fillable;
        }
    
        get primaryKey() {
            return facades.repository.schema(abstract).primaryKey;
        }
    
        get timestamps() {
            return facades.repository.schema(abstract).timestamps;
        }
    
        get softDeletes() {
            return facades.repository.schema(abstract).softDeletes;
        }
    
        get casts(): ModelSchemaAttributes['casts'] {
            return {
                ...facades.repository.schema(abstract).casts,
                ...this.timestamps ? { created_at: 'datetime', updated_at: 'datetime' } : {},
                ...this.softDeletes ? { deleted_at: 'datetime' } : {},
            };
        }
    
        get isDirty() 
        {
            return this._changedKeys.length > 0;
        }
    
        getAttribute(key: string) {
            let value = this._attributes.get(key, null);
            if (key in this.casts) {
                value = this.cast(value, this.casts[key]);
            }
            const reducer = facades.repository[`model${_.upperFirst(_.camelCase(abstract))}Get${_.upperFirst(_.camelCase(key))}Attribute`];
            if (typeof reducer !== 'function') {
                throw new Error('Expect `Repository` to be Reducible');
            }
            // !Reducer `model${ClassName}Get${Key}Attribute`
            return reducer.bind(facades.repository)(value, this);
        }
    
        setAttribute(key: string, value: unknown) {
            if (!this.fillable.includes(key)) {
                if (facades.config.get('app.env', 'production') === 'production') {
                    throw new Error(`[Luminix] Attribute "${key}" in model "${abstract}" is not fillable`);
                } else {
                    facades.log.warning(`[Luminix] Trying to set a non-fillable attribute "${key}" in model "${abstract}".
                    This will throw an error in production.`);
                }
                return;
            }

            const reducer = facades.repository[`model${_.upperFirst(_.camelCase(abstract))}Set${_.upperFirst(_.camelCase(key))}Attribute`];
            if (typeof reducer !== 'function') {
                throw new Error('Expect `Repository` to be Reducible');
            }

            // !Reducer `model${ClassName}Set${Key}Attribute`
            const mutated = reducer.bind(facades.repository)(
                this.mutate(value, this.casts[key]),
                this
            );
    
            if (!this.validateJsonObject({ [key]: mutated })) {
                if (facades.config.get('app.env', 'production') === 'production') {
                    throw new TypeError(`[Luminix] Attribute "${key}" in model "${abstract}" must be a boolean, number, string or null`);
                } else {
                    facades.log.warning(`Invalid type for attribute "${key}" in model "${abstract}" after mutation.
                        This will throw an error in production.`, {
                        key, value, mutated, cast: this.casts[key], item: this.json(),
                    });
                }
                return;
            }
    
            this._attributes.set(key, mutated);

            this._changedKeys.push(key);
    
            this.dispatchChangeEvent({ [key]: mutated });
        }
    
        getKey(): number | string {
            return this.getAttribute(this.primaryKey) as number | string;
        }
    
        getKeyName(): string {
            return this.primaryKey;
        }
    
        fill(attributes: object) {
            const validAttributes = _.pick(attributes, this.fillable);
    
            const mutatedAttributes = Object.entries(validAttributes).reduce((acc: JsonObject, [key, value]) => {
                const reducer = facades.repository[`model${_.upperFirst(_.camelCase(abstract))}Set${_.upperFirst(_.camelCase(key))}Attribute`];
                if (typeof reducer !== 'function') {
                    throw new Error('Expect `Repository` to be Reducible');
                }
                // !Reducer `model${ClassName}Set${Key}Attribute`
                acc[key] = reducer.bind(facades.repository)(
                    this.mutate(value, this.casts[key]),
                    this
                );
                return acc;
            }, {});
    
            if (!this.validateJsonObject(mutatedAttributes)) {
                if (facades.config.get('app.env', 'production') === 'production') {
                    throw new TypeError(`[Luminix] Invalid attributes for model "${abstract}"`);
                } else {
                    facades.log.warning(`Invalid attributes for model "${abstract}" after mutation.
                        This will throw an error in production.`, {
                        attributes, mutatedAttributes, item: this.json(), casts: this.casts,
                    });
                }
                return;
            }
    
            this._attributes.merge('.', mutatedAttributes);

            this._changedKeys.push(...Object.keys(mutatedAttributes));
    
            this.dispatchChangeEvent(mutatedAttributes);
        }
    
        json() {
            const modelRelations = facades.repository.schema(abstract).relations;
    
            const relations = Object.entries(this.relations).reduce((acc, [key, value]) => {
                const { type } = modelRelations[key];
                if (['BelongsTo', 'MorphOne', 'MorphTo'].includes(type) && !Array.isArray(value)) {
                    acc[key] = value.json();
                }
                if (['HasMany', 'BelongsToMany', 'MorphMany', 'MorphToMany'].includes(type) && Array.isArray(value)) {
                    acc[key] = value.map((item) => item.json());
                }
                return acc;
            }, {} as JsonObject);

            const reducer = facades.repository[`model${_.upperFirst(_.camelCase(abstract))}Json`];

            if (typeof reducer !== 'function') {
                throw new Error('Expect `Repository` to be Reducible');
            }

            // !Reducer `model${ClassName}Json`
            return reducer.bind(facades.repository)({
                ...this.attributes,
                ...relations,
            }, this);
        }
    
        diff(): JsonObject {
            return this._changedKeys.reduce((acc, key) => {
                acc[key] = this._attributes.get(key) as JsonValue;
                return acc;
            }, {} as JsonObject);
        }

        getType(): string {
            return abstract;
        }

        async refresh() {
            if (!this.exists) {
                throw new Error('[Luminix] Cannot refresh a model that does not exist');
            }
            const { data } = await facades.route.call([
                `luminix.${abstract}.show`,
                this.makePrimaryKeyReplacer()
            ]);
            this.makeAttributes(data);
        }
    
        async save(options: ModelSaveOptions = {}): Promise<AxiosResponse> {
            try {
                const {
                    additionalPayload = {},
                    sendsOnlyModifiedFields = true,
                } = options;
    
                const exists = this.exists;
    
                const route: RouteGenerator = exists ?
                    [
                        `luminix.${abstract}.update`,
                        this.makePrimaryKeyReplacer()
                    ]
                    : `luminix.${abstract}.store`;
    
                const response = await facades.route.call(
                    route,
                    {
                        data: {
                            ..._.pick(
                                sendsOnlyModifiedFields && exists
                                    ? this.diff()
                                    : this.attributes,
                                this.fillable
                            ),
                            ...additionalPayload,
                        },
                    }
                );
    
                if ([200, 201].includes(response.status)) {
                    this.makeAttributes(response.data);
                    this.exists = true;
                    this.dispatchSaveEvent();
                    if (!exists) {
                        this.dispatchCreateEvent(response.data);
                    } else {
                        this.dispatchUpdateEvent(response.data);
                    }
                    
                    return response;
                }
    
                throw response;
            } catch (error) {
                facades.log.error(error);
                this.dispatchErrorEvent(error, 'save');
                throw error;
            }
        }

        async push(): Promise<AxiosResponse> {
            throw new Error('Method not implemented.');
        }
    
        async delete(): Promise<AxiosResponse> {
            try {
                const response = await facades.route.call([
                    `luminix.${abstract}.destroy`,
                    this.makePrimaryKeyReplacer(),
                ]);
    
                if (response.status === 204) {
                    this.dispatchDeleteEvent();
                    return response;
                }
    
                throw response;
            } catch (error) {
                facades.log.error(error);
                this.dispatchErrorEvent(error, 'delete');
                throw error;
            }
        }

        async update(data: JsonObject): Promise<void> {
            try {
                const response = await facades.route.call([
                    `luminix.${abstract}.update`,
                    this.makePrimaryKeyReplacer()
                ], { data });

                if (response.status === 200) {
                    this.makeAttributes(response.data);
                    this.dispatchUpdateEvent(response.data);
                    return;
                }

                throw response;
            } catch (error) {
                facades.log.error(error);
                this.dispatchErrorEvent(error, 'save');
                throw error;
            }

        }
    
        async forceDelete(): Promise<AxiosResponse> {
            try {
                const response = await facades.route.call(
                    [
                        `luminix.${abstract}.destroy`,
                        this.makePrimaryKeyReplacer(),
                    ],
                    { params: { force: true } }
                );
    
                if (response.status === 204) {
                    this.dispatchDeleteEvent(true);
                    return response;
                }
    
                throw response;
            } catch (error) {
                facades.log.error(error);
                this.dispatchErrorEvent(error, 'forceDelete');
                throw error;
            }
        }
    
        async restore(): Promise<AxiosResponse> {
            try {
                const response = await facades.route.call(
                    [
                        `luminix.${abstract}.update`,
                        this.makePrimaryKeyReplacer()
                    ],
                    { params: { restore: true } }
                );
    
                if (response.status === 200) {
                    this.dispatchRestoreEvent();
                    return response;
                }
    
                throw response;
            } catch (error) {
                facades.log.error(error);
                this.dispatchErrorEvent(error, 'restore');
                throw error;
            }
        }

        static getSchemaName() {
            return abstract;
        }

        static getSchema() {
            return facades.repository.schema(abstract);
        }

        static query() {
            return new Builder(facades, abstract);
        }

        static where(key: string, value: JsonValue) {
            return this.query().where(key, value);
        }

        static orderBy(key: string, direction: 'asc' | 'desc' = 'asc') {
            return this.query().orderBy(key, direction);
        }

        static searchBy(term: string) {
            return this.query().searchBy(term);
        }

        static minified() {
            return this.query().minified();
        }

        static get(page = 1, perPage = 15, replaceLinksWith?: string): Promise<ModelPaginatedResponse> {
            return this.query().get(page, perPage, replaceLinksWith);
        }
    
        static find(id: number | string) {
            return this.query().find(id);
        }

        static first() {
            return this.query().first();
        }
    
        static async create(attributes: JsonObject) {
            const Model = facades.repository.make(abstract);
            const model = new Model();
    
            model.fill(attributes);
    
            await model.save();
    
            return model;
        }
    
        static async update(id: number | string, attributes: JsonObject) {
            const Model = facades.repository.make(abstract);
            const model = new Model({ id });
    
            model.fill(attributes);
            model.exists = true;
    
            await model.save();
    
            return model;
        }
    
        static delete(id: number | string): Promise<AxiosResponse>;
        static delete(id: Array<number | string>): Promise<AxiosResponse>;
        static delete(id: number | string | Array<number | string>) {
            if (Array.isArray(id)) {
                return facades.route.call(`luminix.${abstract}.destroyMany`, { params: { ids: id } });
            }
    
            const Model = facades.repository.make(abstract);
            const model = new Model({ id });
    
            return model.delete();
        }
    
        static async restore(id: number | string): Promise<AxiosResponse>;
        static async restore(id: Array<number | string>): Promise<AxiosResponse>;
        static async restore(id: number | string | Array<number | string>) {
            if (Array.isArray(id)) {
                return facades.route.call(`luminix.${abstract}.restoreMany`, { data: { ids: id } });
            }
    
            const Model = facades.repository.make(abstract);
    
            const model = new Model({ id });
    
            return model.restore();
        }
    
        static forceDelete(id: number | string): Promise<AxiosResponse>;
        static forceDelete(id: Array<number | string>): Promise<AxiosResponse>;
        static forceDelete(id: number | string | Array<number | string>) {
            if (Array.isArray(id)) {
                return facades.route.call(`luminix.${abstract}.destroyMany`, { params: { ids: id, force: true } });
            }
    
            const Model = facades.repository.make(abstract);
    
            const model = new Model({ id });
    
            return model.forceDelete();
        }

        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        on<E extends keyof ModelEvents>(_: E, __: ModelEvents[E]): Unsubscribe {
            throw new Error('Method not implemented.');
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        once<E extends keyof ModelEvents>(_: E, __: ModelEvents[E]): void {
            throw new Error('Method not implemented.');
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        emit<E extends keyof ModelEvents>(_: E, __?: Omit<Parameters<ModelEvents[E]>[0], 'source'>): void {
            throw new Error('Method not implemented.');
        }
    }

    return HasEvents<ModelEvents, typeof ModelRaw>(ModelRaw);
}

export function ModelFactory(facades: AppFacades, abstract: string, CustomModel: typeof BaseModel): typeof Model {
    return class extends CustomModel {

        static name = _.upperFirst(_.camelCase(abstract));

        constructor(attributes: JsonObject = {}) {
            super(attributes);

            return new Proxy(this, {
                get: (target: Model, prop: string) => {

                    if (prop === '__isModel') {
                        return true;
                    }

                    const { config } = facades;

                    // If the property exists in the target, return it.
                    if (prop in target) {
                        const subject = target[prop];
                        if (typeof subject === 'function') {
                            return subject.bind(target);
                        }
                        return subject;
                    }

                    // If the property is a relation, return it.
                    if (Object.keys(target.relations).includes(prop)) {
                        return target.relations[prop];
                    }

                    const lookupKey = config.get('app.enforceCamelCaseForModelAttributes', true)
                        ? _.snakeCase(prop)
                        : prop;

                    // If the property exists in attributes, return it.
                    if (Object.keys(target.attributes).includes(lookupKey)) {
                        return target.getAttribute(lookupKey);
                    }

                    // If there is a reducer to handle a property, return it.
                    if (facades.repository.hasReducer(`model${_.upperFirst(_.camelCase(abstract))}Get${_.upperFirst(_.camelCase(lookupKey))}Attribute`)) {
                        const reducer = facades.repository[`model${_.upperFirst(_.camelCase(abstract))}Get${_.upperFirst(_.camelCase(lookupKey))}Attribute`];
                        if (typeof reducer !== 'function') {
                            throw new Error('Expect `Repository` to be Reducible');
                        }
                        // !Reducer `model${ClassName}Get${Key}Attribute`
                        return reducer.bind(facades.repository)(undefined, target);
                    }

                    return Reflect.get(target, prop);
                },
                set: (target, prop: string, value) => {
                    if (prop in target && typeof target[prop] !== 'function') {
                        return Reflect.set(target, prop, value);
                    }

                    const { config } = facades;

                    const lookupKey = config.get('app.enforceCamelCaseForModelAttributes', true)
                        ? _.snakeCase(prop)
                        : prop;

                    if (target.fillable.includes(lookupKey)) {
                        target.setAttribute(
                            lookupKey,
                            value
                        );
                        return true;
                    }

                    
                    throw new Error(`Cannot set attribute '${prop}' on model '${abstract}'`);
                },
            });
        }

        [key: string]: unknown;

    };

}

export function isModel(value: unknown): value is Model {
    return typeof value === 'object' 
        && value !== null
        && '__isModel' in value
        && value.__isModel === true;
}
