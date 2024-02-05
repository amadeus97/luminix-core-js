/* eslint-disable i18next/no-literal-string */

import { objectSetByPath } from '../support/object';

import { Model, ModelConstructorAttributes, ModelSchema, ModelMaker } from '../types/Model';

// import app from '../helpers/app';


import BaseModel from '../contracts/Model';

import Macro from './Macro';
import App from './App';
import Config from './Config';

const makeBaseModel = ({ modelRepository, className }: ModelMaker) => class Model extends BaseModel {

    constructor(attributes: ModelConstructorAttributes = { id: 0 }) {
        super(modelRepository, className, attributes);
    }

    static getSchemaName() {
        return className;
    }

    static getSchema() {
        return modelRepository.getClassSchema(className);
    }

};


export default class Repository {

    private _schema: ModelSchema | undefined;
    private _baseModels: { [className: string]: typeof Model } = {};
    private _models: { [className: string]: typeof Model } = {};

    constructor(
        private readonly app: App
    ) {
        const config = this.app.getContainer('config') as Config;
        this._schema = config.get('boot.models');

        if (this._schema) {
            this.makeClasses();
        }
    
    };

    private makeBaseModel(className: string) {
        if (!this._baseModels[className]) {
            this._baseModels[className] = makeBaseModel({ modelRepository: this, className }) as any;
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

                        const macros = app.getContainer('macro') as Macro;
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




