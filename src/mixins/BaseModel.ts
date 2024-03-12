
import _ from 'lodash';
import PropertyBag from '../contracts/PropertyBag';

import { BaseModel, JsonObject, ModelSaveOptions, ModelSchemaAttributes, ModelPaginatedResponse, Model, RelationRepository, ModelEvents, JsonValue } from '../types/Model';
import { AppFacades } from '../types/App';
import { RouteGenerator, RouteReplacer } from '../types/Route';
import { AxiosResponse } from 'axios';
import { HasEvents } from './HasEvents';
import { Unsubscribe } from 'nanoevents';

export function BaseModelFactory(facades: AppFacades, abstract: string): typeof BaseModel {

    class ModelRaw {

        private _attributes: PropertyBag<JsonObject>;
        private _original: JsonObject;
        private _relations: RelationRepository = {};
        private _exists = false;
        private _changedKeys: string[] = [];

        constructor(attributes: JsonObject = {}) {
            const { attributes: newAttributes, relations } = this.makeAttributes(attributes);

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
            this._relations = relations;

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
                        newRelations[key] = (attributes[key] as object[]).map((item) => new Model(item as JsonObject));
                    }
                });
            }
    
            return {
                attributes: newAttributes,
                relations: newRelations,
            };
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
    
        get exists()
        {
            // return this.getAttribute(this.primaryKey) !== null;
            return this._exists;
        }
    
        get isDirty() 
        {
            return Object.keys(this.diff()).length > 0;
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

        async refresh() {
            if (!this.exists) {
                throw new Error('[Luminix] Cannot refresh a model that does not exist');
            }
            const { data } = await facades.route.call([
                `luminix.${abstract}.show`,
                this.makePrimaryKeyReplacer()
            ]);
            const { relations, attributes } = this.makeAttributes(data);

            this._attributes = new PropertyBag(attributes);
            this._original = attributes;
            this._relations = relations;
            
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
                            ...sendsOnlyModifiedFields
                                ? _.pick(this.diff(), this.fillable)
                                : _.pick(this.attributes, this.fillable),
                            ...additionalPayload,
                        },
                    }
                );
    
                if ([200, 201].includes(response.status)) {
                    
                    const { attributes, relations } = this.makeAttributes(response.data);
    
                    this._attributes = new PropertyBag(attributes);
                    this._original = attributes;
                    this._relations = relations;
    
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

        static async get(query?: Record<string, unknown>): Promise<ModelPaginatedResponse> {
            if (query && typeof query !== 'object') {
                throw new TypeError('Invalid query');
            }

            const params = (() => {
                if (!query) {
                    return {};
                }
                if (typeof query.filters === 'object') {
                    return {
                        ...query,
                        filters: JSON.stringify(query.filters),
                    };
                }
                return query;
            })();

            const { data } = await facades.route.call(`luminix.${abstract}.index`, { params });
    
            const Model = facades.repository.make(abstract);
    
            const models: Model[] = data.data.map((item: JsonObject) => {
                const value = new Model(item);
                facades.repository.emit('fetch', {
                    class: abstract,
                    model: value,
                });
                value._exists = true;
                return value;
            });
    
            return {
                ...data,
                data: models,
            };
        }
    
        static async find(id: number | string) {
            const pk = facades.repository.schema(abstract).primaryKey;
            if (!pk) {
                throw new Error(`Primary key not found for class '${abstract}'`);
            }
            const { data } = await facades.route.call([
                `luminix.${abstract}.show`,
                { [pk]: id }
            ]);
            
            const Model = facades.repository.make(abstract);
    
            const model = new Model(data);
            model._exists = true;
    
            facades.repository.emit('fetch', {
                class: abstract,
                model,
            });
    
            return model;
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
            model._exists = true;
    
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

                    return target[prop];
                },
                set: (target, prop: string, value) => {
                    if (prop in target && typeof target[prop] !== 'function') {
                        target[prop] = value;
                        return true;
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
