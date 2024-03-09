import { GlobalModelEvents, BaseModel, ModelSchema, ModelSchemaAttributes, Model } from '../types/Model';

import { BaseModelFactory, ModelFactory } from '../mixins/BaseModel';

import { Reducible } from '../mixins/Reducible';
import { AppFacade } from '../types/App';
import { HasEvents } from '../mixins/HasEvents';
import _ from 'lodash';


class Repository {

    private _models: { [abstract: string]: typeof Model } = {};

    static name = 'Repository';

    constructor(
        private readonly _schema: ModelSchema,
    ) {
    }

    boot(app: AppFacade) {
        if (!this._schema) {
            return;
        }
       
        
        Object.keys(this._schema).forEach((abstract) => {
            const modelReducer = this[`model${_.upperFirst(_.camelCase(abstract))}`];
            if (typeof this.model !== 'function' || typeof modelReducer !== 'function') {
                throw new Error('Expect `Repository` to be Reducible');
            }
            // !Reducer `model`
            const Model: typeof BaseModel = this.model(
                BaseModelFactory(app.make(), abstract),
                abstract
            );

            // !Reducer `model${ClassName}`
            const SpecificModel: typeof BaseModel = modelReducer(Model);

            this._models[abstract] = ModelFactory(app.make(), abstract, SpecificModel);
        });
    }

    schema(): ModelSchema
    schema(abstract: string): ModelSchemaAttributes
    schema(abstract?: string) {
        if (!this._schema || (abstract && !this._schema[abstract])) {
            throw new Error(`Schema for class '${abstract}' not found.`);
        }

        if (abstract) {
            return this._schema[abstract];
        }

        return this._schema;

    }


    make(): { [abstract: string]: typeof Model}
    make(abstract: string): typeof Model
    make(abstract?: string) {
        if (abstract && !this._models[abstract]) {
            throw new Error(`Model class '${abstract}' not found.`);
        }

        if (!abstract) {
            return this._models;
        }

        return this._models[abstract];
    }

    toString()
    {
        return 'repository';
    }

    [reducer: string]: unknown;
}


export default Reducible(HasEvents<GlobalModelEvents, typeof Repository>(Repository));

