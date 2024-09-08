import { Reducible, EventSource, Str } from '@luminix/support';

import { BaseModel, ModelSchema, ModelSchemaAttributes, Model, ModelReducers } from '../types/Model';

import { BaseModelFactory, ModelFactory } from '../mixins/BaseModel';

import { AppFacade, GlobalModelEvents } from '../types/App';

import ModelNotFoundException from '../exceptions/ModelNotFoundException';

import BelongsTo from '../contracts/Relation/BelongsTo';
import BelongsToMany from '../contracts/Relation/BelongsToMany';
import HasOne from '../contracts/Relation/HasOne';
import HasMany from '../contracts/Relation/HasMany';
import MorphMany from '../contracts/Relation/MorphMany';
import MorphOne from '../contracts/Relation/MorphOne';
import MorphTo from '../contracts/Relation/MorphTo';
import MorphToMany from '../contracts/Relation/MorphToMany';

export class ModelService extends EventSource<GlobalModelEvents> {

    private _models: { [abstract: string]: typeof Model } = {};

    [Symbol.toStringTag] = 'ModelService';

    constructor(
        private readonly _schema: ModelSchema,
    ) {
        super();
    }

    boot(app: AppFacade) {
        if (!this._schema) {
            return;
        }
       
        
        Object.keys(this._schema).forEach((abstract) => {
            const modelReducer = this[`model${Str.studly(abstract)}`];

            const Model: typeof BaseModel = this.model(
                BaseModelFactory(
                    app.make('config'),
                    app.make('log'),
                    app.make('model'),
                    app.make('route'),
                    abstract,
                ),
                abstract
            );

            const SpecificModel: typeof BaseModel = modelReducer(Model);

            this._models[abstract] = ModelFactory(app.make('model'), abstract, SpecificModel);
        });

    }

    schema(): ModelSchema
    schema(abstract: string): ModelSchemaAttributes
    schema(abstract?: string) {
        if (!this._schema || (abstract && !this._schema[abstract])) {
            throw new ModelNotFoundException(abstract || 'undefined');
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
            throw new ModelNotFoundException(abstract);
        }

        if (!abstract) {
            return this._models;
        }

        return this._models[abstract];
    }

    getRelationConstructors(abstract: string) {
        return this.relationMap({
            'BelongsTo': BelongsTo,
            'BelongsToMany': BelongsToMany,
            'HasOne': HasOne,
            'HasMany': HasMany,
            'MorphMany': MorphMany,
            'MorphOne': MorphOne,
            'MorphTo': MorphTo,
            'MorphToMany': MorphToMany,
        }, abstract);
    }

    toString()
    {
        return 'model';
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
    
    

}


export default Reducible<ModelReducers, typeof ModelService>(ModelService);

