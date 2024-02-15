
/* eslint-disable i18next/no-literal-string */
import PropertyBag from './PropertyBag';

import { Model, ModelAttributes, ModelSaveOptions } from '../types/Model';
import { AppFacades } from '../types/App';

import axios from 'axios';
import _ from 'lodash';
import { diff } from 'deep-object-diff';

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

const objectDiff = (original: any, modified: any) => {
    try {
        return diff(original, modified);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('objectDiff error: ', error);
        return false;
    }
};

export default abstract class BaseModel {

    private _attributes: PropertyBag<ModelAttributes>;
    private _original: ModelAttributes;
    private _relations: { [relationName: string]: Model | Model[] } = {};

    constructor(
        private readonly facades: AppFacades,
        public readonly className: string,
        attributes: ModelAttributes,
    ) {
        const { attributes: newAttributes, relations } = this.makeAttributes(attributes);

        this._attributes = new PropertyBag(newAttributes);
        this._original = newAttributes;
        this._relations = relations;
    }

    private cast(value: any, cast: string) {
        if (value === null || value === undefined) {
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

    private makeAttributes(attributes: ModelAttributes)
    {
        const { fillable, relations } = this.facades.repository.schema(this.className);

        // remove relations from attributes
        const excludedKeys = Object.keys(relations || {});
        const newAttributes = createObjectWithoutKeys(excludedKeys, attributes);

        // fill missing fillable attributes with null
        fillable.filter((key) => !(key in newAttributes)).forEach((key) => {
            newAttributes[key] = null;
        });

        const newRelations: any = {};

        if (relations) {
            Object.entries(relations).forEach(([key, relation]) => {
                const { type, model } = relation;

                if (type === 'MorphTo' && !attributes[`${key}_type`]) {
                    return;
                }

                const Model = this.facades.repository.make(
                    type === 'MorphTo'
                        ? attributes[`${key}_type`] as string
                        : model
                );

                const relationData = attributes[key];
                const isSingle = ['BelongsTo', 'MorphOne', 'MorphTo'].includes(type);

                if (isSingle && typeof relationData === 'object' && relationData !== null) {
                    newRelations[key] = new Model(relationData as ModelAttributes);
                }

                if (!isSingle && Array.isArray(attributes[key])) {
                    newRelations[key] = (attributes[key] as object[]).map((item) => new Model(item as ModelAttributes));
                }
            });
        }

        return {
            attributes: newAttributes,
            relations: newRelations,
        }
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
        return this.facades.repository.schema(this.className).fillable;
    }

    get primaryKey() {
        return this.facades.repository.schema(this.className).primaryKey;
    }

    get timestamps() {
        return this.facades.repository.schema(this.className).timestamps;
    }

    get softDeletes() {
        return this.facades.repository.schema(this.className).softDeletes;
    }

    get casts() {
        return this.facades.repository.schema(this.className).casts;
    }

    get exists()
    {
        return this.getAttribute(this.primaryKey) !== null;
    }

    getAttribute(key: string) {
        let value = this._attributes.get(key, null);
        const { casts } = this.facades.repository.schema(this.className);
        if (casts && casts[key]) {
            value = this.cast(value, casts[key]);
        }
        return this.facades.macro.applyFilters(
            `model_${this.className}_get_${key}_attribute`,
            value,
            this
        );
    }

    setAttribute(key: string, value: any) {
        if (!this.fillable.includes(key)) {
            this.facades.log.warning(`[Luminix] Trying to set a non-fillable attribute "${key}" in model "${this.className}"`);
            return;
        }

        const { casts } = this.facades.repository.schema(this.className);

        this._attributes.set(key, this.facades.macro.applyFilters(
            `model_${this.className}_set_${key}_attribute`,
            this.mutate(value, casts[key]),
            this
        ));
    }

    fill(attributes: object) {
        const validAttributes = createObjectWithKeys(this.fillable, attributes);
        Object.keys(validAttributes).forEach((key) => {
            this.setAttribute(key, validAttributes[key]);
        });
    }

    json() {
        const modelRelations = this.facades.repository.schema(this.className).relations;

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

        return this.facades.macro.applyFilters(`model_${this.className}_json`, {
            ...this.attributes,
            ...relations,
        }, this);
    }

    diff() {
        return objectDiff(this.original, this.attributes);
    }

    async save(options: ModelSaveOptions = {}): Promise<void> {
        try {
            const {
                additionalPayload = {},
                sendsOnlyModifiedFields = true,
            } = options;

            const url = this.facades.route.get(
                `luminix.${this.className}.${this.exists ? 'update' : 'store'}`,
                this.exists && ({ [this.primaryKey]: this.getAttribute(this.primaryKey) as string })
            );

            const method = this.exists ? 'put' : 'post';

            const response = await axios[method](url, {
                ...sendsOnlyModifiedFields
                    ? this.diff()
                    : createObjectWithKeys(this.fillable, this.attributes),
                ...additionalPayload,
            });

            if ([200, 201].includes(response.status)) {
                const { attributes, relations } = this.makeAttributes(response.data);

                this._attributes = new PropertyBag(attributes);
                this._original = attributes;
                this._relations = relations;

                this.facades.macro.doAction(`model_${this.className}_save_success`, this);
                return;
            }

            throw response;
        } catch (error) {
            this.facades.log.error(error);
            this.facades.macro.doAction(`model_${this.className}_save_error`, error, this);
            throw error;
        }
    }

    async delete(): Promise<void> {
        try {
            const url = this.facades.route.get(`luminix.${this.className}.destroy`, { [this.primaryKey]: this.getAttribute(this.primaryKey) as string });

            const response = await axios.delete(url);

            if (response.status === 200) {
                this.facades.macro.doAction(`model_${this.className}_delete_success`, this);
                return;
            }

            throw response;
        } catch (error) {
            this.facades.log.error(error);
            this.facades.macro.doAction(`model_${this.className}_delete_error`, error, this);
            throw error;
        }
    }

    async forceDelete(): Promise<void> {
        try {
            const url = this.facades.route.get(`luminix.${this.className}.destroy`, { [this.primaryKey]: this.getAttribute(this.primaryKey) as string });

            const response = await axios.delete(`${url}?force`);

            if (response.status === 200) {
                this.facades.macro.doAction(`model_${this.className}_force_delete_success`, this);
                return;
            }

            throw response;
        } catch (error) {
            this.facades.log.error(error);
            this.facades.macro.doAction(`model_${this.className}_force_delete_error`, error, this);
            throw error;
        }
    }

    async restore(): Promise<void> {
        try {
            const url = this.facades.route.get(`luminix.${this.className}.update`, { [this.primaryKey]: this.getAttribute(this.primaryKey) as string });

            const response = await axios.put(`${url}?restore`);

            if (response.status === 200) {
                this.facades.macro.doAction(`model_${this.className}_restore_success`, this);
                return;
            }

            throw response;
        } catch (error) {
            this.facades.log.error(error);
            this.facades.macro.doAction(`model_${this.className}_restore_error`, error, this);
            throw error;
        }
    }

    [key: string]: any;
};

