
/* eslint-disable i18next/no-literal-string */
import _ from 'lodash';
import { diff } from 'deep-object-diff';
import PropertyBag from './PropertyBag';

import { Model, JsonObject, ModelSaveOptions, ModelSchemaAttributes, ModelPaginatedResponse, ProxyModel } from '../types/Model';
import { AppFacades } from '../types/App';
import { RouteGenerator, RouteReplacer } from '../types/Route';
import { AxiosResponse } from 'axios';

const createObjectWithKeys = (keys: Array<string>, obj: any) => Object.keys(obj)
    .filter((key) => keys.includes(key))
    .reduce((acc: any, key) => {
        acc[key] = obj[key];
        return acc;
    }, {});

const createObjectWithoutKeys = (keys: Array<string>, obj: any) => Object.keys(obj)
    .filter((key) => !keys.includes(key))
    .reduce((acc: any, key) => {
        acc[key] = obj[key];
        return acc;
    }, {});

export function BaseModelFactory(facades: AppFacades, className: string): typeof Model {

    return class BaseModel extends EventTarget {

        private _attributes: PropertyBag<JsonObject>;
        private _original: JsonObject;
        private _relations: { [relationName: string]: Model | Model[] } = {};

        constructor(attributes: JsonObject = {}) {
            super();
            const { attributes: newAttributes, relations } = this.makeAttributes(attributes);

            if (!this.validateJsonObject(newAttributes)) {
                if (facades.config.get('app.env', 'production') === 'production') {
                    throw new TypeError(`[Luminix] Invalid attributes for model "${className}"`);
                } else {
                    facades.log.warning(`Invalid attributes for model "${className}".
                        This will throw an error in production.`, {
                            attributes, className
                        });
                }
            }

            this._attributes = new PropertyBag(newAttributes);
            this._original = newAttributes;
            this._relations = relations;
        }
    
        private cast(value: any, cast: string) {
            if (value === null || value === undefined || !cast) {
                return value;
            }
    
            if (['boolean', 'bool'].includes(cast)) {
                return !!value;
            }
            if (['date', 'datetime', 'immutable_date', 'immutable_datetime'].includes(cast)) {
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
    
        private mutate(value: any, mutator: string) {
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
            const { relations } = facades.repository.schema(className);
    
            // remove relations from attributes
            const excludedKeys = Object.keys(relations || {});
            const newAttributes = createObjectWithoutKeys(excludedKeys, attributes);
    
            // fill missing fillable attributes with null
            this.fillable.filter((key) => !(key in newAttributes)).forEach((key) => {
                newAttributes[key] = null;
            });
    
            const newRelations: any = {};
    
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
            }
        }
    
        private makePrimaryKeyReplacer(): RouteReplacer {
            return {
                [this.primaryKey]: this.getAttribute(this.primaryKey) as string
            };
        }
    
        private dispatchChangeEvent(change: JsonObject) {
            this.dispatchEvent(new CustomEvent('change', {
                detail: {
                    value: change,
                },
            }));
        }
    
        private dispatchCreateEvent(attributes: JsonObject) {
            this.dispatchEvent(new CustomEvent('create', {
                detail: {
                    value: attributes,
                },
            }));
    
            facades.repository.dispatchEvent(new CustomEvent('create', {
                detail: {
                    class: className,
                    model: this,
                }
            }));
        }
    
        private dispatchUpdateEvent(attributes: JsonObject) {
            this.dispatchEvent(new CustomEvent('update', {
                detail: {
                    value: attributes,
                },
            }));
    
            facades.repository.dispatchEvent(new CustomEvent('update', {
                detail: {
                    class: className,
                    model: this,
                }
            }));
        }
    
        private dispatchSaveEvent() {
            this.dispatchEvent(new CustomEvent('save', {
                detail: {
                    value: this.diff(),
                },
            }));
    
            facades.repository.dispatchEvent(new CustomEvent('save', {
                detail: {
                    class: className,
                    model: this,
                }
            }));
        }
    
        private dispatchDeleteEvent(force = false) {
            this.dispatchEvent(new CustomEvent('delete', {
                detail: {
                    force,
                    [this.getKeyName()]: this.getKey(),
                },
            }));
    
            facades.repository.dispatchEvent(new CustomEvent('delete', {
                detail: {
                    class: className,
                    model: this,
                    force,
                }
            }));
        }
    
        private dispatchRestoreEvent() {
            this.dispatchEvent(new CustomEvent('restore', {
                detail: {
                    value: this.attributes,
                },
            }));
    
            facades.repository.dispatchEvent(new CustomEvent('restore', {
                detail: {
                    class: className,
                    model: this,
                }
            }));
        }
    
        private dispatchErrorEvent(error: any, operation: string) {
            this.dispatchEvent(new CustomEvent('error', {
                detail: {
                    error,
                    operation,
                },
            }));
    
            facades.repository.dispatchEvent(new CustomEvent('error', {
                detail: {
                    class: className,
                    model: this,
                    error,
                    operation,
                }
            }));
        }
    
        private validateJsonObject(json: unknown): json is JsonObject {
            if (typeof json !== 'object' || json === null) {
                return false;
            }
            return Object.entries(json).every(([_, value]) => {
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
            return facades.repository.schema(className).fillable;
        }
    
        get primaryKey() {
            return facades.repository.schema(className).primaryKey;
        }
    
        get timestamps() {
            return facades.repository.schema(className).timestamps;
        }
    
        get softDeletes() {
            return facades.repository.schema(className).softDeletes;
        }
    
        get casts(): ModelSchemaAttributes['casts'] {
            return {
                ...facades.repository.schema(className).casts,
                ...this.timestamps ? { created_at: 'datetime', updated_at: 'datetime' } : {},
                ...this.softDeletes ? { deleted_at: 'datetime' } : {},
            };
        }
    
        get exists()
        {
            return this.getAttribute(this.primaryKey) !== null;
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
            return facades.macro.applyFilters(
                `model_${className}_get_${key}_attribute`,
                value,
                this
            );
        }
    
        setAttribute(key: string, value: any) {
            if (!this.fillable.includes(key)) {
                if (facades.config.get('app.env', 'production') === 'production') {
                    throw new Error(`[Luminix] Attribute "${key}" in model "${className}" is not fillable`);
                } else {
                    facades.log.warning(`[Luminix] Trying to set a non-fillable attribute "${key}" in model "${className}".
                    This will throw an error in production.`);
                }
                return;
            }
    
            const mutated: string | number | boolean | null = facades.macro.applyFilters(
                `model_${className}_set_${key}_attribute`,
                this.mutate(value, this.casts[key]),
                this
            );
    
            if (!this.validateJsonObject({ [key]: mutated })) {
                if (facades.config.get('app.env', 'production') === 'production') {
                    throw new TypeError(`[Luminix] Attribute "${key}" in model "${className}" must be a boolean, number, string or null`);
                } else {
                    facades.log.warning(`Invalid type for attribute "${key}" in model "${className}" after mutation.
                        This will throw an error in production.`, {
                            key, value, mutated, cast: this.casts[key], item: this.json(),
                        });
                }
                return;
            }
    
            this._attributes.set(key, mutated);
    
            this.dispatchChangeEvent({ [key]: mutated });
        }
    
        getKey(): number | string {
            return this.getAttribute(this.primaryKey) as number | string;
        }
    
        getKeyName(): string {
            return this.primaryKey;
        }
    
        fill(attributes: object) {
            const validAttributes = createObjectWithKeys(this.fillable, attributes);
    
            const mutatedAttributes = Object.entries(validAttributes).reduce((acc: any, [key, value]) => {
                acc[key] = facades.macro.applyFilters(
                    `model_${className}_set_${key}_attribute`,
                    this.mutate(value, this.casts[key]),
                    this
                );
                return acc;
            }, {});
    
            if (!this.validateJsonObject(mutatedAttributes)) {
                if (facades.config.get('app.env', 'production') === 'production') {
                    throw new TypeError(`[Luminix] Invalid attributes for model "${className}"`);
                } else {
                    facades.log.warning(`Invalid attributes for model "${className}" after mutation.
                        This will throw an error in production.`, {
                            attributes, mutatedAttributes, item: this.json(), casts: this.casts,
                        });
                }
                return;
            }
    
            this._attributes.merge('.', mutatedAttributes);
    
            this.dispatchChangeEvent(mutatedAttributes);
        }
    
        json() {
            const modelRelations = facades.repository.schema(className).relations;
    
            const relations: any = Object.entries(this.relations).reduce((acc: any, [key, value]) => {
                const { type } = modelRelations[key];
                if (['BelongsTo', 'MorphOne', 'MorphTo'].includes(type) && !Array.isArray(value)) {
                    acc[key] = value.json();
                }
                if (['HasMany', 'BelongsToMany', 'MorphMany', 'MorphToMany'].includes(type) && Array.isArray(value)) {
                    acc[key] = value.map((item) => item.json());
                }
                return acc;
            }, {});
    
            return facades.macro.applyFilters(`model_${className}_json`, {
                ...this.attributes,
                ...relations,
            }, this);
        }
    
        diff() {
            return diff(this.original, this.attributes);
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
                        `luminix.${className}.update`,
                        this.makePrimaryKeyReplacer()
                    ]
                    : `luminix.${className}.store`;
    
                const response = await facades.route.call(
                    route,
                    {
                        data: {
                            ...sendsOnlyModifiedFields
                                ? this.diff()
                                : createObjectWithKeys(this.fillable, this.attributes),
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
                // facades.macro.doAction(`model_${className}_save_error`, error, this);
                this.dispatchErrorEvent(error, 'save');
                throw error;
            }
        }
    
        async delete(): Promise<AxiosResponse> {
            try {
                const response = await facades.route.call([
                    `luminix.${className}.destroy`,
                    this.makePrimaryKeyReplacer(),
                ]);
    
                if (response.status === 204) {
                    // facades.macro.doAction(`model_${className}_delete_success`, this);
                    this.dispatchDeleteEvent();
                    return response;
                }
    
                throw response;
            } catch (error) {
                facades.log.error(error);
                // facades.macro.doAction(`model_${className}_delete_error`, error, this);
                this.dispatchErrorEvent(error, 'delete');
                throw error;
            }
        }
    
        async forceDelete(): Promise<AxiosResponse> {
            try {
                const response = await facades.route.call(
                    [
                        `luminix.${className}.destroy`,
                        this.makePrimaryKeyReplacer(),
                    ],
                    { params: { force: true } }
                );
    
                if (response.status === 204) {
                    // facades.macro.doAction(`model_${className}_force_delete_success`, this);
                    this.dispatchDeleteEvent(true);
                    return response;
                }
    
                throw response;
            } catch (error) {
                facades.log.error(error);
                // facades.macro.doAction(`model_${className}_force_delete_error`, error, this);
                this.dispatchErrorEvent(error, 'forceDelete');
                throw error;
            }
        }
    
        async restore(): Promise<AxiosResponse> {
            try {
                const response = await facades.route.call(
                    [
                        `luminix.${className}.update`,
                        this.makePrimaryKeyReplacer()
                    ],
                    { params: { restore: true } }
                );
    
                if (response.status === 200) {
                    // facades.macro.doAction(`model_${className}_restore_success`, this);
                    this.dispatchRestoreEvent();
                    return response;
                }
    
                throw response;
            } catch (error) {
                facades.log.error(error);
                // facades.macro.doAction(`model_${className}_restore_error`, error, this);
                this.dispatchErrorEvent(error, 'restore');
                throw error;
            }
        }

        static getSchemaName() {
            return className;
        }

        static getSchema() {
            return facades.repository.schema(className);
        }

        static async get(query?: object): Promise<ModelPaginatedResponse> {
            const { data } = await facades.route.call(`luminix.${className}.index`, { params: query });
    
            const Model = facades.repository.make(className);
    
            const models: Model[] = data.data.map((item: any) => {
                const value = new Model(item);
                facades.repository.dispatchEvent(new CustomEvent('fetch', {
                    detail: {
                        class: className,
                        [value.getKeyName()]: value.getKey(),
                        value,
                        fromData: item,
                    }
                }));
                return value;
            });
    
            return {
                ...data,
                data: models,
            };
        }
    
        static async find(id: number | string) {
            const pk = facades.repository.schema(className).primaryKey;
            if (!pk) {
                throw new Error(`Primary key not found for class '${className}'`);
            }
            const { data } = await facades.route.call([
                `luminix.${className}.show`,
                { [pk]: id }
            ]);
            
            const Model = facades.repository.make(className);
    
            const model = new Model(data);
    
            facades.repository.dispatchEvent(new CustomEvent('fetch', {
                detail: {
                    class: className,
                    [model.getKeyName()]: model.getKey(),
                    model,
                    fromData: data,
                }
            }));
    
            return model;
        }
    
        static async create(attributes: JsonObject) {
            const Model = facades.repository.make(className);
            const model = new Model();
    
            model.fill(attributes);
    
            await model.save();
    
            return model;
        }
    
        static async update(id: number, attributes: JsonObject) {
            const Model = facades.repository.make(className);
            const model = new Model({ id });
    
            model.fill(attributes);
    
            await model.save();
    
            return model;
        }
    
        static delete(id: number | number[]) {
            if (Array.isArray(id)) {
                return facades.route.call(`luminix.${className}.destroyMany`, { params: { ids: id } });
            }
    
            const Model = facades.repository.make(className);
            const model = new Model({ id });
    
            return model.delete();
        }
    
        static async restore(id: number | number[]) {
            if (Array.isArray(id)) {
                return facades.route.call(`luminix.${className}.restoreMany`, { data: { ids: id } });
            }
    
            const Model = facades.repository.make(className);
    
            const model = new Model({ id });
    
            return model.restore();
        }
    
        static forceDelete(id: number | number[]) {
            if (Array.isArray(id)) {
                return facades.route.call(`luminix.${className}.destroyMany`, { params: { ids: id, force: true } });
            }
    
            const Model = facades.repository.make(className);
    
            const model = new Model({ id });
    
            return model.forceDelete();
        }

    };
}

export function ModelFactory(facades: AppFacades, className: string, BaseModel: typeof Model): typeof ProxyModel {
    // const BaseModel = BaseModelFactory(facades, className);
    return class extends BaseModel {

        static name = _.upperFirst(_.camelCase(className));

        /**
         * Cria uma nova instância de Model, utilizando Proxy para acesso fluente aos atributos.
         *
         * @param {object} attributes - Atributos do modelo.
         */
        constructor(attributes: JsonObject = {}) {
            super(attributes);

            return new Proxy(this, {
                get: (target: ProxyModel, prop: string) => {

                    const { macro, config } = facades;

                    // If the property exists in the target, return it.
                    if (prop in target) {
                        if (typeof target[prop] === 'function') {
                            return target[prop].bind(target);
                        }
                        return target[prop];
                    }

                    // If the property is a relation, return it.
                    if (Object.keys(target.relations).includes(prop)) {
                        return target.relations[prop];
                    }

                    // If there is a macro to handle a method, return it.                        
                    if (macro.hasFilter(`model_${className}_call_${_.snakeCase(prop)}_method`)) {
                        return macro.applyFilters(`model_${className}_call_${_.snakeCase(prop)}_method`, () => null, target);
                    }

                    const lookupKey = config.get('app.enforceCamelCaseForModelAttributes', true)
                        ? _.snakeCase(prop)
                        : prop;

                    // If the property exists in attributes, return it.
                    if (Object.keys(target.attributes).includes(lookupKey)) {
                        return target.getAttribute(lookupKey);
                    }

                    // If there is a macro to handle a property, return it.
                    if (macro.hasFilter(`model_${className}_get_${lookupKey}_attribute`)) {
                        return macro.applyFilters(
                            `model_${className}_get_${lookupKey}_attribute`,
                            undefined,
                            target
                        );
                    }

                    return target[prop];
                },
                set: (target, prop: string, value) => {

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
                    
                    throw new Error(`Cannot set attribute '${prop}' on model '${className}'`);
                },
            });
        }

    }
}
