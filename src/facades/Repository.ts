/* eslint-disable i18next/no-literal-string */

import { Model, ModelConstructorAttributes, ModelPaginatedResponse, ModelSchema, RepositoryFacade, RepositoryMakeFunction, RepositorySchemaFunction } from '../types/Model';

import App from './App';
import BaseModel from '../contracts/BaseModel';
import route from '../helpers/route';

import axios from 'axios';
import _ from 'lodash';


export default class Repository implements RepositoryFacade {

    private _schema: ModelSchema | undefined;
    private _models: { [className: string]: typeof Model } = {};

    constructor(
        private readonly app: App
    ) {
        const config = this.app.make('config');
        this._schema = config.get('boot.models');

        
        this.makeClasses();
        
    
    };

    private makeModelClass(className: string): typeof Model {
        // const BaseModel = this.makeBaseModel(className);

        const app = this.app;

        return class extends BaseModel {

            /**
             * Cria uma nova instância de Model, utilizando Proxy para acesso fluente aos atributos.
             *
             * @param {object} attributes - Atributos do modelo.
             */
            constructor(attributes: ModelConstructorAttributes = {}) {
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

                        // If there is a macro to handle a property or the property exists in attributes, return it.
                        if (macro.hasFilter(`model_${className}_get_${_.snakeCase(prop)}_attribute`) || Object.keys(target.attributes).includes(lookupKey)) {
                            return macro.applyFilters(`model_${className}_get_${_.snakeCase(prop)}_attribute`, target.attributes[lookupKey], target);
                        }

                        return target[prop];
                    },
                    set: (target, prop: string, value) => {

                        const { config, macro } = app.make();

                        const lookupKey = config.get('app.enforceCamelCaseForModelAttributes', true)
                            ? _.snakeCase(prop)
                            : prop;

                        if (target.fillable.includes(lookupKey)) {
                            target.setAttribute(
                                lookupKey, 
                                macro.applyFilters(`model_${className}_set_${_.snakeCase(prop)}_attribute`, value, target)
                            );
                            return true;
                        }
                        return true;
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
                const { data } = await axios.get(route(`luminix.${className}.list`), { params: query });

                const Model = app.make('repository').make(className);

                return {
                    ...data,
                    data: data.data.map((item: any) => new Model(item)),
                };
            }

            static async find(id: number) {
                const { data } = await axios.get(route(`luminix.${className}.item`, { id }));

                const Model = app.make('repository').make(className);

                return new Model(data);
            }

            static async create(attributes: ModelConstructorAttributes) {
                const Model = app.make('repository').make(className);
                const model = new Model();

                model.fill(attributes);

                await model.save();

                return model;
            }

            static async update(id: number, attributes: ModelConstructorAttributes) {
                const Model = app.make('repository').make(className);
                const model = new Model({ id });
 
                model.fill(attributes);

                await model.save();

                return model;
            }

            static delete(id: number) {
                const Model = app.make('repository').make(className);
                const model = new Model({ id });

                return model.delete();
            }

            static async restore(id: number) {
                const Model = app.make('repository').make(className);

                const model = new Model({ id });

                await model.restore();

                return model;
            }

            static forceDelete(id: number) {
                const Model = app.make('repository').make(className);

                const model = new Model({ id });

                return model.forceDelete();
            }

            static massDelete(ids: number[]) {
                return axios.post(route(`luminix.${className}.massDelete`), { ids });
            }

            static massRestore(ids: number[]) {
                return axios.post(route(`luminix.${className}.massRestore`), { ids });
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




