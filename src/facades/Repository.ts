/* eslint-disable i18next/no-literal-string */

import { Model, ModelAttributes, ModelPaginatedResponse, ModelSchema, RepositoryFacade, RepositoryMakeFunction, RepositorySchemaFunction } from '../types/Model';

import BaseModel from '../contracts/BaseModel';

import _ from 'lodash';
import { AppFacade } from '../types/App';


export default class Repository implements RepositoryFacade {

    private _schema: ModelSchema | undefined;
    private _models: { [className: string]: typeof Model } = {};

    constructor(
        private readonly app: AppFacade,
    ) {
        const config = this.app.make('config');
        this._schema = config.get('boot.models');

        
        this.makeClasses();
        
    
    };

    private makeModelClass(className: string): typeof Model {
        // const BaseModel = this.makeBaseModel(className);

        const app = this.app;

        return class extends BaseModel {

            static name = _.upperFirst(_.camelCase(className));

            /**
             * Cria uma nova instância de Model, utilizando Proxy para acesso fluente aos atributos.
             *
             * @param {object} attributes - Atributos do modelo.
             */
            constructor(attributes: ModelAttributes = {}) {
                super(app.make(), className, attributes);

                return new Proxy(this, {
                    get: (target: BaseModel, prop: string) => {

                        const { macro, config } = app.make();

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

                        const { config } = app.make();

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

            static getSchemaName() {
                return className;
            }

            static getSchema() {
                return app.make('repository').schema(className);
            }

            static async get(query?: object): Promise<ModelPaginatedResponse> {
                const { data } = await app.make('route').call(`luminix.${className}.index`, { params: query });

                const Model = app.make('repository').make(className);

                return {
                    ...data,
                    data: data.data.map((item: any) => new Model(item)),
                };
            }

            static async find(id: number | string) {
                const pk = app.make('repository').schema(className).primaryKey;
                const { data } = await app.make('route').call([
                    `luminix.${className}.show`,
                    { [pk]: id }
                ]);
                
                const Model = app.make('repository').make(className);

                return new Model(data);
            }

            static async create(attributes: ModelAttributes) {
                const Model = app.make('repository').make(className);
                const model = new Model();

                model.fill(attributes);

                await model.save();

                return model;
            }

            static async update(id: number, attributes: ModelAttributes) {
                const Model = app.make('repository').make(className);
                const model = new Model({ id });
 
                model.fill(attributes);

                await model.save();

                return model;
            }

            static delete(id: number | number[]) {
                if (Array.isArray(id)) {
                    return app.make('route').call(`luminix.${className}.destroyMany`, { params: { ids: id } });
                }

                const Model = app.make('repository').make(className);
                const model = new Model({ id });

                return model.delete();
            }

            static async restore(id: number | number[]) {
                if (Array.isArray(id)) {
                    return app.make('route').call(`luminix.${className}.restoreMany`, { data: { ids: id } });
                }

                const Model = app.make('repository').make(className);

                const model = new Model({ id });

                return model.restore();
            }

            static forceDelete(id: number | number[]) {
                if (Array.isArray(id)) {
                    return app.make('route').call(`luminix.${className}.destroyMany`, { params: { ids: id, force: true } });
                }

                const Model = app.make('repository').make(className);

                const model = new Model({ id });

                return model.forceDelete();
            }

        };
    }

    private makeClasses() {
        if (!this._schema) {
            return;
        }
        Object.keys(this._schema).forEach((className) => {
            this._models[className] = this.makeModelClass(className);
        });
    }

    readonly schema = ((className?: string) => {
        if (!this._schema || (className && !this._schema[className])) {
            throw new Error(`Schema for class '${className}' not found.`);
        }

        if (className) {
            return this._schema[className];
        }

        return this._schema;
        
    }) as RepositorySchemaFunction;


    readonly make = ((className?: string) => {
        if (className && !this._models[className]) {
            throw new Error(`Model class '${className}' not found.`);
        }

        if (!className) {
            return this._models;
        }

        return this._models[className];
    }) as RepositoryMakeFunction;


}




