import { GlobalModelEvents, BaseModel, ModelSchema, ModelSchemaAttributes, Model, ModelFacade as ModelFacadeInterface } from '../types/Model';

import { BaseModelFactory, ModelFactory } from '../mixins/BaseModel';

import { Reducible } from '../mixins/Reducible';
import { AppFacade } from '../types/App';
import { HasEvents } from '../mixins/HasEvents';
import _ from 'lodash';
import { Unsubscribe } from 'nanoevents';
import { Reducer, ReducerCallback, Unsubscribe as UnsubscribeReducer } from '../types/Reducer';
import { Collection } from '../contracts/Collection';


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
                throw new Error('Expect `ModelFacade` to be Reducible');
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
        return 'model';
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public on<K extends keyof GlobalModelEvents>(_: K, __: GlobalModelEvents[K]): Unsubscribe {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public once<K extends keyof GlobalModelEvents>(_: K, __: GlobalModelEvents[K]): void {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public emit<K extends keyof GlobalModelEvents>(_: K, __?: Omit<Parameters<GlobalModelEvents[K]>[0], 'source'>): void {
        throw new Error('Method not implemented.');
    }


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public reducer(_: string, __: ReducerCallback): UnsubscribeReducer {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public removeReducer(_: string): void {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getReducer(_: string): Collection<Reducer> {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public hasReducer(_: string): boolean {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public clearReducer(_: string): void {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public flushReducers(): void {
        throw new Error('Method not implemented.');
    }

    [reducer: string]: unknown;
}


export default HasEvents<GlobalModelEvents, typeof ModelFacade>(Reducible(ModelFacade));

