/* eslint-disable i18next/no-literal-string */

import { GlobalModelEvents, Model, ModelSchema, ModelSchemaAttributes, ProxyModel, RepositoryFacade } from '../types/Model';

import { BaseModelFactory, ModelFactory } from '../contracts/BaseModel';

import _ from 'lodash';
import { AppFacade } from '../types/App';
import EventSource from '../contracts/EventSource';


export default class Repository extends EventSource<GlobalModelEvents> implements RepositoryFacade {

    private _schema: ModelSchema | undefined;
    
    private _models: { [className: string]: typeof ProxyModel } = {};

    constructor(
        private readonly app: AppFacade,
    ) {
        super();
        const config = this.app.make('config');
        this._schema = config.get('boot.models');

        
        this.makeClasses();
        
    
    };

    private makeClasses() {
        if (!this._schema) {
            return;
        }
        Object.keys(this._schema).forEach((className) => {
            const BaseModel: typeof Model = this.app.make('macro').reduce(
                `repository_base_model_${className}`,
                BaseModelFactory(this.app.make(), className),
                this.app,
                className
            );
            // this._baseModels[className] = BaseModel;
            this._models[className] = ModelFactory(this.app.make(), className, BaseModel);
        });
    }

    schema(): ModelSchema
    schema(className: string): ModelSchemaAttributes
    schema(className?: string) {
        if (!this._schema || (className && !this._schema[className])) {
            throw new Error(`Schema for class '${className}' not found.`);
        }

        if (className) {
            return this._schema[className];
        }

        return this._schema;
        
    };


    make(): { [className: string]: typeof ProxyModel}
    make(className: string): typeof ProxyModel
    make(className?: string) {
        if (className && !this._models[className]) {
            throw new Error(`Model class '${className}' not found.`);
        }

        if (!className) {
            return this._models;
        }

        return this._models[className];
    };


}




