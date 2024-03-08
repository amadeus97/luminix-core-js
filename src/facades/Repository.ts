import { GlobalModelEvents, BaseModel, ModelSchema, ModelSchemaAttributes, Model } from '../types/Model';

import { BaseModelFactory, ModelFactory } from '../mixins/BaseModel';

import { Reducible } from '../mixins/Reducible';
import { AppFacade } from '../types/App';
import { HasEvents } from '../mixins/HasEvents';
import _ from 'lodash';


class Repository {

    private _models: { [className: string]: typeof Model } = {};

    static name = 'Repository';

    constructor(
        private readonly _schema: ModelSchema,
    ) {
    }

    boot(app: AppFacade) {
        if (!this._schema) {
            return;
        }
       
        
        Object.keys(this._schema).forEach((className) => {
            const modelReducer = this[`model${_.upperFirst(_.camelCase(className))}`];
            if (typeof this.model !== 'function' || typeof modelReducer !== 'function') {
                throw new Error('Expect `Repository` to be Reducible');
            }
            // !Reducer `model`
            const Model: typeof BaseModel = this.model(
                BaseModelFactory(app.make(), className),
                className
            );

            // !Reducer `model${ClassName}`
            const SpecificModel: typeof BaseModel = modelReducer(Model);

            this._models[className] = ModelFactory(app.make(), className, SpecificModel);
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

    }


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
    }

    toString()
    {
        return 'repository';
    }

    [reducer: string]: unknown;
}


export default Reducible(HasEvents<GlobalModelEvents, typeof Repository>(Repository));

