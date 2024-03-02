/* eslint-disable i18next/no-literal-string */

import { GlobalModelEvents, BaseModel, ModelSchema, ModelSchemaAttributes, Model } from '../types/Model';

import { BaseModelFactory, ModelFactory } from '../contracts/BaseModel';

import _ from 'lodash';

import { Macroable } from '../contracts/Macroable';
import { AppFacade } from '../types/App';
import { HasEvents } from '../contracts/HasEvents';


class Repository {

    private _models: { [className: string]: typeof Model } = {};

    constructor(
        private readonly _schema: ModelSchema,
    ) {
    };

    boot(app: AppFacade) {
        if (!this._schema) {
            return;
        }
        
        Object.keys(this._schema).forEach((className) => {
            // !Macro `model`
            const Model: typeof BaseModel = this.model(
                BaseModelFactory(app.make(), className),
                className
            );

            this._models[className] = ModelFactory(app.make(), className, Model);
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


    make(): { [className: string]: typeof Model}
    make(className: string): typeof Model
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


export default Macroable(HasEvents<GlobalModelEvents, typeof Repository>(Repository));

