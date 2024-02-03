
import { createObjectWithKeys, createObjectWithoutKeys, objectDiff } from '../support/object';
// import toast from '../services/toast';
import axios from 'axios';

import { ModelAttributes, ModelConstructorAttributes, ModelSaveOptions } from '../types/Model';

import route from '../helpers/route';
import Repository from '../containers/Repository';

// import { ModelRepository } from './singletons/ModelRepository';
type ModelRepository = Repository;

export default class Model {

    #attributes: ModelAttributes = {};
    #id: number = 0;
    #key?: string;
    #fillable: string[] = [];
    #original?: object;
    #relations: { [relationName: string]: Model | Model[] } = {};
    #createdAt: Date | null = null;
    #updatedAt: Date | null = null;
    #deletedAt: Date | null = null;


    constructor(
        public readonly modelRepository: ModelRepository,
        public readonly className: string,
        attributes: ModelConstructorAttributes = { id: 0 }
    ) {
        this.construct(attributes);
    }

    construct(attributes: ModelConstructorAttributes) {
        this.#key = crypto.randomUUID();

        const { fillable, relations } = this.modelRepository.getClassSchema(this.className);

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

                const Model = this.modelRepository.getModelClass(
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
            ? new Date(createdAt)
            : null;

        this.#updatedAt = updatedAt
            ? new Date(updatedAt)
            : null;

        this.#deletedAt = deletedAt
            ? new Date(deletedAt)
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
        const modelRelations = this.modelRepository.getClassSchema(this.className).relations;

        const relations: any = Object.entries(this.relations).reduce((acc: any, [key, value]) => {
            const { type } = modelRelations[key];
            if (['BelongsTo', 'MorphOne', 'MorphTo'].includes(type) && value instanceof Model) {
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

