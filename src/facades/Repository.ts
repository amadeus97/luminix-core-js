/* eslint-disable i18next/no-literal-string */

import { GlobalModelEvents, Model, ModelSchema, ModelSchemaAttributes, ProxyModel } from '../types/Model';

import { BaseModelFactory, ModelFactory } from '../contracts/BaseModel';

import _ from 'lodash';

import EventSource from '../contracts/EventSource';
import { Macroable } from '../contracts/Macroable';
import { AppFacade } from '..';


class Repository extends EventSource<GlobalModelEvents> {

    private _models: { [className: string]: typeof ProxyModel } = {};

    constructor(
        private readonly _schema: ModelSchema,
    ) {
        super();
    };

    boot(app: AppFacade) {
        if (!this._schema) {
            return;
        }
        
        Object.keys(this._schema).forEach((className) => {
            // !Macro `transformBaseModel`
            const BaseModel: typeof Model = this.transformBaseModel(
                BaseModelFactory(app.make(), className),
                className
            );

            this._models[className] = ModelFactory(app.make(), className, BaseModel);
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

    [macro: string]: any;
}


export default Macroable(Repository);

