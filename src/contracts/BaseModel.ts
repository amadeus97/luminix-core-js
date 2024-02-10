
/* eslint-disable i18next/no-literal-string */

import { createObjectWithKeys, createObjectWithoutKeys, objectDiff } from '../support/object';

import { Model, ModelConstructorAttributes, ModelAttributes, ModelSaveOptions } from '../types/Model';
import { AppFacades } from '../types/App';

import route from '../helpers/route';
import axios from 'axios';
import _ from 'lodash';

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
        attributes: ModelConstructorAttributes = { id: 0 }
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
                createdAt,
                this
            )
            : null;

        this._updatedAt = updatedAt
            ? this.facades.macro.applyFilters(
                `model_${this.className}_get_updated_at_attribute`,
                updatedAt,
                this
            )
            : null;
        
        this._deletedAt = deletedAt
            ? this.facades.macro.applyFilters(
                `model_${this.className}_get_deleted_at_attribute`,
                deletedAt,
                this
            )
            : null;

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


    setAttribute(key: string, value: any) {
        if (!this.fillable.includes(key)) {
            this.facades.log.warning(`[Luminix] Trying to set a non-fillable attribute "${key}" in model "${this.className}"`);
            return;
        }
        const newAttributes = structuredClone(this.attributes);
        newAttributes[key] = value;
        this._attributes = newAttributes;
        // return true;
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
        });
    }

    diff() {
        return objectDiff(this.original, this.attributes);
    }

    save(options: ModelSaveOptions = {}): Promise<void> {
        return new Promise((resolve, reject) => {
            const {
                additionalPayload = {},
                sendsOnlyModifiedFields = true,
            } = options;
    
            const routeName = `luminix.${this.className}.${this.id === 0 ? 'create' : 'update'}`;

            const url = route(
                routeName,
                this.id === 0
                    ? false
                    : { id: this.id }
                );    

            if (!url) {
                reject(new Error(`URL for "${routeName}" not found.`));
                return;
            }
            axios({
                url,
                method: 'POST',
                data: {
                    ...sendsOnlyModifiedFields
                        ? this.diff()
                        : createObjectWithKeys(this.fillable, this.attributes),
                    ...additionalPayload,
                },
            })
                .then((response) => {
                    if (response.status === 200) {
                        this.construct(response.data);
                        this.facades.macro.doAction(`model_${this.className}_save_success`, this);
                        resolve();
                        return;
                    }
                    reject(response);
                })
                .catch((error) => {
                    console.error(error);

                    this.facades.macro.doAction(`model_${this.className}_save_error`, error, this);

                    reject(error);
                });
        });
    }

    delete(): Promise<void> {
        return new Promise((resolve, reject) => {
            const url = route(`luminix.${this.className}.delete`, { id: this.id });
            if (!url) {
                reject(new Error(`URL for "luminix.${this.className}.delete" not found.`));
                return;
            }
            axios({
                url,
                method: 'DELETE',
            })
                .then((response) => {
                    if (response.status === 200) {
                        this.facades.macro.doAction(`model_${this.className}_delete_success`, this);
                        resolve();
                        return;
                    }
                    reject(response);
                })
                .catch((error) => {
                    console.error(error);
                    this.facades.macro.doAction(`model_${this.className}_delete_error`, error, this);
                    reject(error);
                });
        });
    }

    forceDelete(): Promise<void> {
        return new Promise((resolve, reject) => {
            const url = route(`luminix.${this.className}.forceDelete`, { id: this.id });

            if (!url) {
                reject(new Error(`URL for "luminix.${this.className}.forceDelete" not found.`));
                return;
            }

            axios({
                url,
                method: 'DELETE',
            })
                .then((response) => {
                    if (response.status === 200) {
                        this.facades.macro.doAction(`model_${this.className}_force_delete_success`, this);
                        resolve();
                        return;
                    }
                    reject(response);
                })
                .catch((error) => {
                    console.error(error);
                    this.facades.macro.doAction(`model_${this.className}_force_delete_error`, error, this);
                    reject(error);
                });
        });
    }

    restore(): Promise<void> {
        return new Promise((resolve, reject) => {
            const url = route(`luminix.${this.className}.restore`, { id: this.id });

            if (!url) {
                reject(new Error(`URL for "luminix.${this.className}.restore" not found.`));
            }
            axios({
                url,
                method: 'POST',
            })
                .then((response) => {
                    if (response.status === 200) {
                        this.facades.macro.doAction(`model_${this.className}_restore_success`, this);
                        resolve();
                        return;
                    }
                    reject(response);
                })
                .catch((error) => {
                    console.error(error);
                    this.facades.macro.doAction(`model_${this.className}_restore_error`, error, this);
                    reject(error);
                });
        });
    }

    [key: string]: any;
};

