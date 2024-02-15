
/* eslint-disable i18next/no-literal-string */
import { Model, ModelConstructorAttributes, ModelAttributes, ModelSaveOptions } from '../types/Model';
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

    private _attributes: ModelAttributes = {};
    private _id: number = 0;
    private _fillable: string[] = [];
    private _original?: object;
    private _relations: { [relationName: string]: Model | Model[] } = {};
    private _createdAt: any = null;
    private _updatedAt: any = null;
    private _deletedAt: any = null;


    constructor(
        private readonly facades: AppFacades,
        public readonly className: string,
        attributes: ModelConstructorAttributes
    ) {
        this.construct(attributes);
    }

    private construct(attributes: ModelConstructorAttributes) {
        const { fillable, relations } = this.facades.repository.schema(this.className);

        const excludedKeys = [
            'id', 'created_at', 'updated_at', 'deleted_at', 'created_by',
            'updated_by', ...Object.keys(relations || {})
        ];

        const newAttributes = createObjectWithoutKeys(excludedKeys, attributes);

        const {
            id = 0, created_at: createdAt, updated_at: updatedAt,
            deleted_at: deletedAt,
        } = attributes;

        fillable.forEach((key) => {
            if (newAttributes[key] === undefined) {
                newAttributes[key] = null;
            }
        });

        this._attributes = newAttributes;

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
                    newRelations[key] = new Model(relationData as ModelConstructorAttributes);
                }

                if (!isSingle && Array.isArray(attributes[key])) {
                    newRelations[key] = (attributes[key] as object[]).map((item) => new Model(item as ModelConstructorAttributes));
                }
            });
        }

        this._relations = newRelations;

        this._original = { ...this._attributes };
        this._id = id;
        this._fillable = fillable;

        this._createdAt = createdAt
            ? this.facades.macro.applyFilters(
                `model_${this.className}_get_created_at_attribute`,
                this.cast(createdAt, 'datetime'),
                this
            )
            : null;

        this._updatedAt = updatedAt
            ? this.facades.macro.applyFilters(
                `model_${this.className}_get_updated_at_attribute`,
                this.cast(updatedAt, 'datetime'),
                this
            )
            : null;
        
        this._deletedAt = deletedAt
            ? this.facades.macro.applyFilters(
                `model_${this.className}_get_deleted_at_attribute`,
                this.cast(deletedAt, 'datetime'),
                this
            )
            : null;

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

    get id() {
        return this._id;
    }

    get attributes() {
        return this._attributes;
    }

    get original() {
        return this._original;
    }

    get fillable() {
        return this._fillable;
    }

    get relations() {
        return this._relations;
    }

    get createdAt() {
        return this._createdAt;
    }

    get updatedAt() {
        return this._updatedAt;
    }

    get deletedAt() {
        return this._deletedAt;
    }

    getAttribute(key: string) {
        let value = this.attributes[key];
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
        const newAttributes = _.cloneDeep(this.attributes);
        const { casts } = this.facades.repository.schema(this.className);
        newAttributes[key] = this.facades.macro.applyFilters(
            `model_${this.className}_set_${key}_attribute`,
            this.mutate(value, casts[key]),
            this
        );
        this._attributes = newAttributes;
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
            id: this.id,
            ...this.attributes,
            ...relations,
            // eslint-disable-next-line camelcase
            created_at: this.createdAt,
            // eslint-disable-next-line camelcase
            updated_at: this.updatedAt,
            ...(this.facades.repository.schema(this.className).softDelete
                ? { deleted_at: this.deletedAt }
                : {}),
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
    
            const routeName = `luminix.${this.className}.${this.id === 0 ? 'create' : 'update'}`;

            const url = this.facades.route.get(
                routeName,
                this.id === 0
                    ? false
                    : { id: this.id }
                );

            const response = await axios.post(url, {
                ...sendsOnlyModifiedFields
                    ? this.diff()
                    : createObjectWithKeys(this.fillable, this.attributes),
                ...additionalPayload,
            })
                
            if ([200, 201].includes(response.status)) {
                this.construct(response.data);
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
            const url = this.facades.route.get(`luminix.${this.className}.delete`, { id: this.id });

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
            const url = this.facades.route.get(`luminix.${this.className}.forceDelete`, { id: this.id });

            const response = await axios.delete(url);

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
            const url = this.facades.route.get(`luminix.${this.className}.restore`, { id: this.id });

            const response = await axios.post(url);

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

