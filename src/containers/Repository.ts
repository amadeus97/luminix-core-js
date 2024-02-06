/* eslint-disable i18next/no-literal-string */

import { createObjectWithKeys, createObjectWithoutKeys, objectDiff, objectSetByPath } from '../support/object';

import { Model as ModelClass, ModelConstructorAttributes, ModelSchema, ModelMaker, ModelAttributes, ModelSaveOptions } from '../types/Model';

// import BaseModel from '../contracts/Model';

import App from './App';
import { AppContainers } from '../types/App';
import route from '../helpers/route';
import axios from 'axios';

class BaseModel {

    #attributes: ModelAttributes = {};
    #id: number = 0;
    #key?: string;
    #fillable: string[] = [];
    #original?: object;
    #relations: { [relationName: string]: ModelClass | ModelClass[] } = {};
    #createdAt: any = null;
    #updatedAt: any = null;
    #deletedAt: any = null;


    constructor(
        public readonly containers: AppContainers,
        public readonly className: string,
        attributes: ModelConstructorAttributes = { id: 0 }
    ) {
        this.construct(attributes);
    }

    construct(attributes: ModelConstructorAttributes) {
        this.#key = crypto.randomUUID();

        const { fillable, relations } = this.containers.repository.getClassSchema(this.className);

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

        this.#attributes = newAttributes;

        const newRelations: any = {};

        if (relations) {
            Object.entries(relations).forEach(([key, relation]) => {
                const { type, model } = relation;

                if (type === 'MorphTo' && !attributes[`${key}_type`]) {
                    return;
                }

                const Model = this.containers.repository.getModelClass(
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

        this.#relations = newRelations;

        this.#original = { ...this.#attributes };
        this.#id = id;
        this.#fillable = fillable;

        this.#createdAt = createdAt
            ? this.containers.macro.applyFilters(
                `model_${this.className}_get_created_at_attribute`,
                createdAt,
                this
            )
            : null;

        this.#updatedAt = updatedAt
            ? this.containers.macro.applyFilters(
                `model_${this.className}_get_updated_at_attribute`,
                updatedAt,
                this
            )
            : null;
        
        this.#deletedAt = deletedAt
            ? this.containers.macro.applyFilters(
                `model_${this.className}_get_deleted_at_attribute`,
                deletedAt,
                this
            )
            : null;

    }

    get id() {
        return this.#id;
    }

    get attributes() {
        return this.#attributes;
    }

    get original() {
        return this.#original;
    }

    get fillable() {
        return this.#fillable;
    }

    get relations() {
        return this.#relations;
    }

    get createdAt() {
        return this.#createdAt;
    }

    get updatedAt() {
        return this.#updatedAt;
    }

    get deletedAt() {
        return this.#deletedAt;
    }


    setAttribute(key: string, value: any) {
        if (!this.fillable.includes(key)) {
            return false;
        }
        const newAttributes = structuredClone(this.attributes);
        newAttributes[key] = value;
        this.#attributes = newAttributes;
        return true;
    }

    fill(attributes: object) {
        // console.log('fill started');
        const validAttributes = createObjectWithKeys(this.fillable, attributes);
        Object.keys(validAttributes).forEach((key) => {
            this.setAttribute(key, validAttributes[key]);
        });
    }

    json() {
        const modelRelations = this.containers.repository.getClassSchema(this.className).relations;

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

        return {
            id: this.id,
            ...this.attributes,
            ...relations,
            // eslint-disable-next-line camelcase
            created_at: this.createdAt,
            // eslint-disable-next-line camelcase
            updated_at: this.updatedAt,
            _key: this.key(),
        };
    }

    diff() {
        return objectDiff(this.original, this.attributes);
    }

    save(options: ModelSaveOptions = {}) {
        const {
            additionalPayload = {},
            sendsOnlyModifiedFields = true,
            silent = false,
        } = options;

        const url = route(
            `luminix.${this.className}.${this.id === 0 ? 'create' : 'update'}`,
            this.id === 0
                ? false
                : { id: this.id }
            );

        return new Promise((resolve) => {
            if (!url) {
                resolve(false);
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
                        if (!silent) {
                            // toast.success(t());
                        }
                        this.construct(response.data);
                        resolve(true);
                        return;
                    }
                    resolve(false);
                })
                .catch((error) => {
                    console.error(error);

                    if (!silent && error.response?.status === 422) {
                        const errors = Object.keys(error.response.data.errors);

                        let errorMessage = error.response.data.message;
                        errors.forEach((errorKey) => {
                            errorMessage += `\n ${errorKey}: ${error.response
                                .data.errors[errorKey]}`;
                        });
                        // toast.error(errorMessage);
                        resolve(false);
                        return;
                    }
                    if (!silent) {
                        // toast.error(error.message);
                    }

                    resolve(false);
                });
        });
    }

    delete() {
        const url = route(`luminix.${this.className}.delete`, { id: this.id });

        return new Promise((resolve) => {
            if (!url) {
                resolve(false);
                return;
            }
            axios({
                url,
                method: 'DELETE',
            })
                .then((response) => {
                    if (response.status === 200) {
                        resolve(true);
                        return;
                    }
                    resolve(false);
                })
                .catch((error) => {
                    console.error(error);
                    resolve(false);
                });
        });
    }

    forceDelete() {
        const url = route(`luminix.${this.className}.forceDelete`, { id: this.id });

        return new Promise((resolve) => {
            if (!url) {
                resolve(false);
                return;
            }

            axios({
                url,
                method: 'DELETE',
            })
                .then((response) => {
                    if (response.status === 200) {
                        resolve(true);
                        return;
                    }
                    resolve(false);
                })
                .catch((error) => {
                    console.error(error);
                    resolve(false);
                });
        });
    }

    restore() {
        if (!this.deletedAt) {
            throw new Error('O modelo não foi apagado.');
        }

        const url = route(`luminix.${this.className}.restore`, { id: this.id });
        return new Promise((resolve) => {

            if (!url) {
                resolve(false);
                return;
            }
            axios({
                url,
                method: 'POST',
            })
                .then((response) => {
                    if (response.status === 200) {
                        resolve(true);
                        return;
                    }
                    resolve(false);
                })
                .catch((error) => {
                    console.error(error);
                    resolve(false);
                });
        });
    }

    key() {
        return this.#key;
    }

};

const makeBaseModel = ({ containers, className }: ModelMaker) => class Model extends BaseModel {

    constructor(attributes: ModelConstructorAttributes = { id: 0 }) {
        super(containers, className, attributes);
    }

    static getSchemaName() {
        return className;
    }

    static getSchema() {
        return containers.repository.getClassSchema(className);
    }

};

export {
     BaseModel,
};

export default class Repository {

    private _schema: ModelSchema | undefined;
    private _baseModels: { [className: string]: typeof ModelClass } = {};
    private _models: { [className: string]: typeof ModelClass } = {};

    constructor(
        private readonly app: App
    ) {
        const config = this.app.getContainer('config');
        this._schema = config.get('boot.models');

        if (this._schema) {
            this.makeClasses();
        }
    
    };

    private makeBaseModel(className: string) {
        if (!this._baseModels[className]) {
            this._baseModels[className] = makeBaseModel({ containers: this.app.getContainers(), className }) as any;
        }
        return this._baseModels[className];
    }

    private makeModelClass(className: string) {
        const BaseModel = this.makeBaseModel(className);

        const app = this.app;

        return class Model extends BaseModel {

            /**
             * Cria uma nova instância de Model, utilizando Proxy para acesso fluente aos atributos.
             *
             * @param {object} attributes - Atributos do modelo.
             */
            constructor(attributes: ModelConstructorAttributes) {
                super(attributes);

                return new Proxy(this, {
                    get: (target: Model, prop: string) => {
                        if (prop in target) {
                            if (typeof target[prop] === 'function') {
                                return target[prop].bind(target);
                            }
                            return target[prop];
                        }
                        if (Object.keys(target.relations).includes(prop)) {
                            return target.relations[prop];
                        }
                        if (typeof target[prop] === 'function') {
                            return target[prop].bind(target);
                        }

                        const macros = app.getContainer('macro');
                        if (macros.hasFilter(`model_${className}_call_${prop}`)) {
                            return macros.applyFilters(`model_${className}_call_${prop}`, () => null, target);
                        }
                        if (macros.hasFilter(`model_${className}_get_${prop}_attribute`)) {
                            return macros.applyFilters(`model_${className}_get_${prop}_attribute`, target.attributes[prop], target);
                        }
                        return target[prop];
                    },
                    set: (target, prop: string, value) => {
                        if (target.fillable.includes(prop)) {
                            target.setAttribute(prop, value);
                            return true;
                        }
                        return true;
                    },
                });
            }

        };
    }

    private makeClasses() {
        Object.keys(this._schema as ModelSchema).forEach((className) => {
            this._models[className] = this.makeModelClass(className);
        });
    }

    getClassSchema(className: string) {
        if (!this._schema || !this._schema[className]) {
            throw new Error(`Schema for class '${className}' not found.`);
        }

        const { [className]: schema } = this._schema;

        return schema;
    };


    getModelClass(className: string) {
        if (!this._models[className]) {
            throw new Error(`Model class '${className}' not found.`);
        }
        return this._models[className];
    }

    getModels() {
        return this._models;
    }

    createEmptyModelInstance(className: string, schema = 'default') {
        // console.log('creating instance ....');

        const createClassInitialValues = (fields: any[]) => fields
            .reduce((obj, field) => {
                if (field.initialValue !== undefined) {
                    return objectSetByPath(obj, field.name, field.initialValue);
                }
                return obj;
            }, {});

        const Model = this.getModelClass(className);
        const { fields: { [schema]: schemaFields } } = this.getClassSchema(className);

        const initialValues: ModelConstructorAttributes = createClassInitialValues(schemaFields);

        return new Model(initialValues);
    }

}




