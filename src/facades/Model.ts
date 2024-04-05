import { GlobalModelEvents, BaseModel, ModelSchema, ModelSchemaAttributes, Model, ModelFacade as ModelFacadeInterface } from '../types/Model';

import { BaseModelFactory, ModelFactory } from '../mixins/BaseModel';

import { Reducible } from '../mixins/Reducible';
import { AppFacade } from '../types/App';
import { HasEvents } from '../mixins/HasEvents';
import _ from 'lodash';
import { Unsubscribe } from 'nanoevents';
import { Reducer, ReducerCallback, Unsubscribe as UnsubscribeReducer } from '../types/Reducer';
import { Collection } from '../contracts/Collection';
import NotReducibleException from '../exceptions/NotReducibleException';
import MethodNotImplementedException from '../exceptions/MethodNotImplementedException';
import ModelNotFoundException from '../exceptions/ModelNotFoundException';

import BelongsTo from '../contracts/Relation/BelongsTo';
import BelongsToMany from '../contracts/Relation/BelongsToMany';
import HasOne from '../contracts/Relation/HasOne';
import HasMany from '../contracts/Relation/HasMany';
import MorphMany from '../contracts/Relation/MorphMany';
import MorphOne from '../contracts/Relation/MorphOne';
import MorphTo from '../contracts/Relation/MorphTo';
import MorphToMany from '../contracts/Relation/MorphToMany';



class ModelFacade implements ModelFacadeInterface {

    private _models: { [abstract: string]: typeof Model } = {};

    static name = 'ModelFacade';

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
                throw new NotReducibleException('ModelFacade');
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


        this.reducer('relationMap', () => ({
            'BelongsTo': BelongsTo,
            'BelongsToMany': BelongsToMany,
            'HasOne': HasOne,
            'HasMany': HasMany,
            'MorphMany': MorphMany,
            'MorphOne': MorphOne,
            'MorphTo': MorphTo,
            'MorphToMany': MorphToMany,
        }), 0);
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

    toString()
    {
        return 'model';
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public on<K extends keyof GlobalModelEvents>(_: K, __: GlobalModelEvents[K]): Unsubscribe {
        throw new MethodNotImplementedException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public once<K extends keyof GlobalModelEvents>(_: K, __: GlobalModelEvents[K]): void {
        throw new MethodNotImplementedException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public emit<K extends keyof GlobalModelEvents>(_: K, __?: Omit<Parameters<GlobalModelEvents[K]>[0], 'source'>): void {
        throw new MethodNotImplementedException();
    }


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public reducer(_: string, __: ReducerCallback, ___?: number): UnsubscribeReducer {
        throw new MethodNotImplementedException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public removeReducer(_: string): void {
        throw new MethodNotImplementedException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getReducer(_: string): Collection<Reducer> {
        throw new MethodNotImplementedException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public hasReducer(_: string): boolean {
        throw new MethodNotImplementedException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public clearReducer(_: string): void {
        throw new MethodNotImplementedException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public flushReducers(): void {
        throw new MethodNotImplementedException();
    }

    [reducer: string]: unknown;
}


export default HasEvents<GlobalModelEvents, typeof ModelFacade>(Reducible(ModelFacade));

