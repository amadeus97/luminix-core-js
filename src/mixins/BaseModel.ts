
import {
    PropertyBag, EventSource, Collection, Response,
    Str, Obj, JsonObject, JsonValue,
    Client
} from '@luminix/support';

import { 
    BaseModel, ModelSaveOptions, ModelSchemaAttributes,
    ModelPaginatedResponse, Model as ModelInterface, RelationRepository, ModelEvents,
    Model,
} from '../types/Model';

import { ModelFacade } from '../types/App';
import { RouteFacade, RouteGenerator, RouteReplacer } from '../types/Route';

import Builder from '../contracts/Builder';
import Relation from '../contracts/Relation';

import NotReducibleException from '../exceptions/NotReducibleException';
import MethodNotImplementedException from '../exceptions/MethodNotImplementedException';
import ModelNotPersistedException from '../exceptions/ModelNotPersistedException';

import { BuilderInterface as BuilderBase, Scope as ScopeBase, ExtendedOperator } from '../types/Builder';
import { LogFacade } from '../types/Log';
import { ConfigFacade } from '../types/Config';

// import App from '../facades/App';
// import Log from '../facades/Log';
// import Route from '../facades/Route';
// import ModelFacade from '../facades/Model';

type BuilderInterface = BuilderBase<ModelInterface, ModelPaginatedResponse>;
type Scope = ScopeBase<ModelInterface, ModelPaginatedResponse>;

export function BaseModelFactory(
    Config: ConfigFacade,
    Log: LogFacade,
    ModelFacade: ModelFacade,
    Route: RouteFacade,
    abstract: string
): typeof BaseModel {

    return class extends EventSource<ModelEvents> {

        private _attributes: PropertyBag<JsonObject> = new PropertyBag({});
        private _original: JsonObject = {};
        private _relations: RelationRepository = {};
        private _changedKeys: string[] = [];
        
        public exists = false;
        public wasRecentlyCreated = false;

        static name = Str.studly(abstract);

        [Symbol.toStringTag] = Str.studly(abstract);

        constructor(attributes: JsonObject = {}) {
            super();
            this.makeRelations();
            this.makeAttributes(attributes);

        }
    
        private cast(value: unknown, cast: string) {
            if (value === null || value === undefined || !cast) {
                return value;
            }
    
            if (['boolean', 'bool'].includes(cast)) {
                return !!value;
            }
            if (['date', 'datetime', 'immutable_date', 'immutable_datetime'].includes(cast) && typeof value === 'string') {
                return new Date(value);
            }
            if (
                ['float', 'double', 'integer', 'int'].includes(cast)
                || cast.startsWith('decimal:')
            ) {
                return Number(value);
            }
    
            return value;
        }
    
        private mutate(value: unknown, mutator: string) {
            if (value === null || value === undefined || !mutator) {
                return value;
            }
            if (['boolean', 'bool'].includes(mutator)) {
                return !!value;
            }
            if (['date', 'datetime', 'immutable_date', 'immutable_datetime'].includes(mutator) && value instanceof Date) {
                return value.toISOString();
            }
            if (
                ['float', 'double', 'integer', 'int'].includes(mutator)
                || mutator.startsWith('decimal:')
            ) {
                return Number(value);
            }
    
            return value;
        }

        private makeRelations() {
            const { relations } = ModelFacade.schema(abstract);
    
            this._relations = {};

            if (!relations) {
                return;
            }

            // !Reducer `relationMap`
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const relationMap = ModelFacade.getRelationConstructors(abstract); //(ModelFacade.relationMap as any)({}, abstract);
    
            Object.entries(relations).forEach(([key, relation]) => {
                const { type } = relation;

                const RelationClass = type in relationMap
                    ? relationMap[type]
                    : Relation;

                this._relations[key] = new RelationClass(
                    { model: ModelFacade, route: Route },
                    { name: key, ...relation },
                    this,
                    null,
                );
            });
        }
    
        private makeAttributes(attributes: JsonObject)
        {
            const { relations } = ModelFacade.schema(abstract);
    
            // remove relations from attributes
            const excludedKeys = Object.keys(relations || {});
            const newAttributes: JsonObject = Obj.omit(attributes, ...excludedKeys);
    
            // fill missing fillable attributes with null
            this.fillable.filter((key) => !(key in newAttributes)).forEach((key) => {
                newAttributes[key] = null;
            });
    
            if (relations) {
                Object.keys(relations).forEach((key) => {
                    this.relation(Str.camel(key))!.make(attributes[key]);
                });
            }

            if (!this.validateJsonObject(newAttributes)) {
                if (Config.get('app.env', 'production') === 'production') {
                    throw new TypeError(`[Luminix] Invalid attributes for model "${abstract}"`);
                } else {
                    Log.warning(`Invalid attributes for model "${abstract}".
                        This will throw an error in production.`, {
                        attributes, abstract
                    });
                }
            }

            this._attributes.set('.', newAttributes);
            this._original = newAttributes;
            this._changedKeys.splice(0, this._changedKeys.length);
        }
    
        private makePrimaryKeyReplacer(): RouteReplacer {
            return {
                [this.getKeyName()]: this.getKey(),
            };
        }
    
        private dispatchChangeEvent(change: JsonObject) {
            this.emit('change', {
                value: change,
                source: this,
            });
        }
    
        private dispatchCreateEvent(attributes: JsonObject) {
            this.emit('create', {
                value: attributes,
                source: this,
            });
    
            ModelFacade.emit('create', {
                class: abstract,
                model: this,
                source: ModelFacade,
            });
        }
    
        private dispatchUpdateEvent(attributes: JsonObject) {
            this.emit('update', {
                value: attributes,
                source: this,
            });
    
            ModelFacade.emit('update', {
                class: abstract,
                model: this,
                source: ModelFacade,
            });
        }
    
        private dispatchSaveEvent() {
            this.emit('save', {
                value: this.diff(),
                source: this,
            });
    
            ModelFacade.emit('save', {
                class: abstract,
                model: this,
                source: ModelFacade,
            });
        }
    
        private dispatchDeleteEvent(force = false) {
            this.emit('delete', {
                force,
                [this.getKeyName()]: this.getKey(),
                source: this,
            });
    
            ModelFacade.emit('delete', {
                class: abstract,
                model: this,
                source: ModelFacade,
                force,
            });
        }
    
        private dispatchRestoreEvent() {
            this.emit('restore', {
                value: this.attributes,
                source: this,
            });
    
            ModelFacade.emit('restore', {
                class: abstract,
                model: this,
                source: ModelFacade,
            });
        }
    
        private dispatchErrorEvent(error: unknown, operation: 'save' | 'delete' | 'restore' | 'forceDelete') {
            this.emit('error', {
                error,
                operation,
                source: this,
            });
    
            ModelFacade.emit('error', {
                class: abstract,
                model: this,
                source: ModelFacade,
                error,
                operation,
            });
        }

        private updateChangedKeys(key: string) {

            const determineValueEquality = (a: unknown, b: unknown) => {
                if (typeof a === 'object' && a !== null) {
                    return Obj.isEqual(a, b);
                }

                return a == b;
            };

            if (!this._changedKeys.includes(key) && !determineValueEquality(Obj.get(this._original, key), this._attributes.get(key))) {
                this._changedKeys.push(key);
            } else if (this._changedKeys.includes(key) && determineValueEquality(Obj.get(this._original, key), this._attributes.get(key))) {
                this._changedKeys.splice(this._changedKeys.indexOf(key), 1);
            }

        }
    
        private validateJsonObject(json: unknown): json is JsonObject {
            if (typeof json !== 'object' || json === null) {
                return false;
            }
            return Object.entries(json).every(([, value]) => {
                return ['boolean', 'number', 'string'].includes(typeof value) 
                    || value === null 
                    || this.validateJsonObject(value)
                    || (Array.isArray(value) && value.every((item) => this.validateJsonObject(item)));
            });
        }
    
        get attributes() {
            return this._attributes.all();
        }
    
        get original() {
            return this._original;
        }
    
        get relations() {
            return this._relations;
        }
    
        get fillable() {
            return ModelFacade.schema(abstract).fillable;
        }
    
        get primaryKey() {
            return ModelFacade.schema(abstract).primaryKey;
        }
    
        get timestamps() {
            return ModelFacade.schema(abstract).timestamps;
        }
    
        // get softDeletes() {
        //     return ModelFacade.schema(abstract).softDeletes;
        // }
    
        get casts(): ModelSchemaAttributes['casts'] {
            return {
                ...ModelFacade.schema(abstract).casts,
                ...this.timestamps ? { created_at: 'datetime', updated_at: 'datetime' } : {},
                // ...this.softDeletes ? { deleted_at: 'datetime' } : {},
            };
        }
    
        get isDirty() 
        {
            return this._changedKeys.length > 0;
        }

        /* * * * */
    
        getAttribute(key: string) {
            let value = this._attributes.get(key, null);
            if (key in this.casts) {
                value = this.cast(value, this.casts[key]);
            }
            const reducer = ModelFacade[`model${Str.studly(abstract)}Get${Str.studly(key)}Attribute`];
            if (typeof reducer !== 'function') {
                throw new NotReducibleException('ModelFacade');
            }
            // !Reducer `model${ClassName}Get${Key}Attribute`
            return reducer.bind(ModelFacade)(value, this);
        }
    
        setAttribute(key: string, value: unknown) {
            // if (!this.fillable.includes(key)) {
            //     if (app.isProduction()) {
            //         throw new AttributeNotFillableException(abstract, key);
            //     } else {
            //         Log.warning(`[Luminix] Trying to set a non-fillable attribute "${key}" in model "${abstract}". This will throw an error in production.`);
            //     }
            //     return;
            // }

            const reducer = ModelFacade[`model${Str.studly(abstract)}Set${Str.studly(key)}Attribute`];
            if (typeof reducer !== 'function') {
                throw new NotReducibleException('ModelFacade');
            }

            // !Reducer `model${ClassName}Set${Key}Attribute`
            const mutated = reducer.bind(ModelFacade)(
                this.mutate(value, this.casts[key]),
                this
            );
    
            if (!this.validateJsonObject({ [key]: mutated })) {
                if (Config.get('app.env', 'production') === 'production') {
                    throw new TypeError(`[Luminix] Attribute "${key}" in model "${abstract}" must be a boolean, number, string or null`);
                } else {
                    Log.warning(`Invalid type for attribute "${key}" in model "${abstract}" after mutation.
                        This will throw an error in production.`, {
                        key, value, mutated, cast: this.casts[key], item: this.toJson(),
                    });
                }
                return;
            }
    
            this._attributes.set(key, mutated);

            this.updateChangedKeys(key);
    
            this.dispatchChangeEvent({ [key]: mutated });
        }
    
        getKey(): number | string {
            return this.getAttribute(this.primaryKey) as number | string;
        }
    
        getKeyName(): string {
            return this.primaryKey;
        }
    
        fill(attributes: object) {
            const validAttributes = Obj.pick(attributes, ...this.fillable);
    
            const mutatedAttributes = Object.entries(validAttributes).reduce((acc: JsonObject, [key, value]) => {
                const reducer = ModelFacade[`model${Str.studly(abstract)}Set${Str.studly(key)}Attribute`];
                if (typeof reducer !== 'function') {
                    throw new NotReducibleException('ModelFacade');
                }
                // !Reducer `model${ClassName}Set${Key}Attribute`
                acc[key] = reducer.bind(ModelFacade)(
                    this.mutate(value, this.casts[key]),
                    this
                );
                return acc;
            }, {});
    
            if (!this.validateJsonObject(mutatedAttributes)) {
                if (Config.get('app.env', 'production') === 'production') {
                    throw new TypeError(`[Luminix] Invalid attributes for model "${abstract}"`);
                } else {
                    Log.warning(`Invalid attributes for model "${abstract}" after mutation.
                        This will throw an error in production.`, {
                        attributes, mutatedAttributes, item: this.toJson(), casts: this.casts,
                    });
                }
                return;
            }
    
            this._attributes.merge('.', mutatedAttributes);

            Object.keys(mutatedAttributes).forEach((key) => this.updateChangedKeys(key));
    
            this.dispatchChangeEvent(mutatedAttributes);
        }

        dump() {
            Log.info({
                ...this.toJson(),
                [Symbol.toStringTag]: Str.studly(abstract),
            });
        }
    
        toJson() {  
            const relations = Object.entries(this.relations).reduce((acc, [key, relation]) => {
                if (!relation.isLoaded()) {
                    return acc;
                }

                if (relation.isSingle()) {
                    acc[Str.snake(key)] = (relation.getLoadedItems() as Model).toJson();
                } else if (relation.isMultiple()) {
                    acc[Str.snake(key)] = (relation.getLoadedItems() as Collection<Model>).map((item) => item.toJson()).all();
                }

                return acc;
            }, {} as JsonObject);

            const reducer = ModelFacade[`model${Str.studly(abstract)}Json`];

            if (typeof reducer !== 'function') {
                throw new NotReducibleException('ModelFacade');
            }

            // !Reducer `model${ClassName}Json`
            return reducer.bind(ModelFacade)({
                ...this.attributes,
                ...relations,
            }, this);
        }
    
        diff(): JsonObject {
            return this._changedKeys.reduce((acc, key) => {
                acc[key] = this._attributes.get(key) as JsonValue;
                return acc;
            }, {} as JsonObject);
        }

        getType(): string {
            return abstract;
        }

        relation(name: string) {
            if (name !== Str.camel(name)) {
                return undefined;
            }
            return this.relations[Str.snake(name)];
        }

        getErrorBag(method: string) {
            const prefix = this.exists
                ? `${abstract}[${this.getKey()}].`
                : `${abstract}.`;

            return `${prefix}${method}`;
        }

        getRouteForSave(): RouteGenerator {
            return this.exists ?
                [
                    `luminix.${abstract}.update`,
                    this.makePrimaryKeyReplacer()
                ]
                : `luminix.${abstract}.store`;
        }

        getRouteForUpdate(): RouteGenerator {
            return [
                `luminix.${abstract}.update`,
                this.makePrimaryKeyReplacer()
            ];
        }

        getRouteForDelete(): RouteGenerator {
            return [
                `luminix.${abstract}.destroy`,
                this.makePrimaryKeyReplacer(),
            ];
        }

        getRouteForRefresh(): RouteGenerator {
            return [
                `luminix.${abstract}.show`,
                this.makePrimaryKeyReplacer()
            ];
        }

        getLabel(): string {

            const { labeledBy } = ModelFacade.schema(abstract);

            return this.getAttribute(labeledBy) as string;
        }

        /* * * * */

        async refresh(tap?: (client: Client) => Client) {
            if (!this.exists) {
                throw new ModelNotPersistedException(abstract, 'refresh');
            }
            const response = await Route.call<JsonObject>(
                this.getRouteForRefresh(),
                tap,
                this.getErrorBag('fetch'),
            );

            this.makeAttributes(response.json());
        }
    
        async save(options: ModelSaveOptions = {}, tap?: (client: Client) => Client): Promise<Response|void> {
            try {
                const {
                    additionalPayload = {},
                    sendsOnlyModifiedFields = true,
                } = options;
    
                const existedBeforeSaving = this.exists;

                const data = {
                    ...Obj.pick(
                        sendsOnlyModifiedFields && existedBeforeSaving
                            ? this.diff()
                            : this.attributes,
                        ...this.fillable
                    ),
                    ...additionalPayload,
                };

                if (Obj.isEmpty(data)) {
                    return;
                }
    
                const response = await Route.call<JsonObject>(
                    this.getRouteForSave(),
                    (client) => {
                        if (tap) {
                            return tap(client.withData(data));
                        }
                        return client.withData(data);
                    },
                    this.getErrorBag(existedBeforeSaving
                        ? 'update'
                        : 'store'),
                );

                if (response.successful()) {
                    this.makeAttributes(response.json());
                    this.exists = true;
                    this.dispatchSaveEvent();
                    if (!existedBeforeSaving) {
                        this.wasRecentlyCreated = true;
                        this.dispatchCreateEvent(response.json());
                    } else {
                        this.dispatchUpdateEvent(response.json());
                    }
                    
                    return response;
                }
    
                throw response;
            } catch (error) {
                this.dispatchErrorEvent(error, 'save');
                throw error;
            }
        }

        async push(): Promise<Response> {
            throw new MethodNotImplementedException();
        }
    
        async delete(): Promise<Response> {
            try {
                const response = await Route.call(
                    this.getRouteForDelete(),
                    undefined,
                    this.getErrorBag('delete'),
                );
    
                if (response.noContent()) {
                    this.dispatchDeleteEvent();
                    return response;
                }
    
                throw response;
            } catch (error) {
                this.dispatchErrorEvent(error, 'delete');
                throw error;
            }
        }

        async update(data: JsonObject, tap?: (client: Client) => Client): Promise<void> {
            try {
                const response = await Route.call<JsonObject>(
                    this.getRouteForUpdate(),
                    (client) => {
                        if (tap) {
                            return tap(client.withData(data));
                        }
                        return client.withData(data);
                    },
                    this.getErrorBag('update'),
                );

                if (response.ok()) {
                    this.makeAttributes(response.json());
                    this.dispatchUpdateEvent(response.json());
                    return;
                }

                throw response;
            } catch (error) {
                this.dispatchErrorEvent(error, 'save');
                throw error;
            }

        }
    
        async forceDelete(): Promise<Response> {
            try {
                const response = await Route.call(
                    this.getRouteForDelete(),
                    (client) => client.withQueryParameters({ force: true }),
                    this.getErrorBag('forceDelete'),
                );
    
                if (response.noContent()) {
                    this.dispatchDeleteEvent(true);
                    return response;
                }
    
                throw response;
            } catch (error) {
                this.dispatchErrorEvent(error, 'forceDelete');
                throw error;
            }
        }
    
        async restore(): Promise<Response> {
            try {
                const response = await Route.call(
                    this.getRouteForUpdate(),
                    (client) => client.withQueryParameters({ restore: true }),
                    this.getErrorBag('restore'),
                );
    
                if (response.ok()) {
                    this.dispatchRestoreEvent();
                    return response;
                }
    
                throw response;
            } catch (error) {
                this.dispatchErrorEvent(error, 'restore');
                throw error;
            }
        }

        static getSchemaName() {
            return abstract;
        }

        static getSchema() {
            return ModelFacade.schema(abstract);
        }

        static query() {
            return new Builder(
                { config: Config, route: Route, model: ModelFacade },
                abstract
            );
        }

        static where(scope: Scope): BuilderInterface
        static where(key: string, value: JsonValue): BuilderInterface
        static where(key: string, operator: ExtendedOperator, value: JsonValue): BuilderInterface
        static where(...args: unknown[]): BuilderInterface {
            return this.query().where(...args as [string, ExtendedOperator, JsonValue]);
        }

        static whereNull(key: string) {
            return this.query().whereNull(key);
        }

        static whereNotNull(key: string) {
            return this.query().whereNotNull(key);
        }

        static whereBetween(key: string, value: [JsonValue, JsonValue]) {
            return this.query().whereBetween(key, value);
        }

        static whereNotBetween(key: string, value: [JsonValue, JsonValue]) {
            return this.query().whereNotBetween(key, value);
        }

        static orderBy(key: string, direction: 'asc' | 'desc' = 'asc') {
            return this.query().orderBy(key, direction);
        }

        static searchBy(term: string) {
            return this.query().searchBy(term);
        }

        static minified() {
            return this.query().minified();
        }

        static limit(value: number) {
            return this.query().limit(value);
        }

        static get(page = 1, replaceLinksWith?: string): Promise<ModelPaginatedResponse> {
            return this.query().get(page, replaceLinksWith);
        }
    
        static find(id: number | string) {
            return this.query().find(id);
        }

        static first() {
            return this.query().first();
        }
    
        static async create(attributes: JsonObject) {
            const Model = ModelFacade.make(abstract);
            const model = new Model();
    
            model.fill(attributes);
    
            await model.save();
    
            return model;
        }
    
        static async update(id: number | string, attributes: JsonObject) {
            const Model = ModelFacade.make(abstract);
            const model = new Model({ id });
    
            model.fill(attributes);
            model.exists = true;
    
            await model.save();
    
            return model;
        }
    
        static delete(id: number | string): Promise<Response>;
        static delete(id: Array<number | string>): Promise<Response>;
        static delete(id: number | string | Array<number | string>) {
            if (Array.isArray(id)) {
                return Route.call(
                    `luminix.${abstract}.destroyMany`,
                    (client) => client.withQueryParameters({ ids: id }),
                    `${abstract}.deleteMany`,
                );
                //     {
                //     params: { ids: id },
                //     errorBag: `${abstract}.deleteMany`,
                // });
            }
    
            const Model = ModelFacade.make(abstract);
            const model = new Model({ id });
    
            return model.delete();
        }
    
        static async restore(id: number | string): Promise<Response>;
        static async restore(id: Array<number | string>): Promise<Response>;
        static async restore(id: number | string | Array<number | string>) {
            if (Array.isArray(id)) {
                return Route.call(
                    `luminix.${abstract}.restoreMany`, 
                    (client) => client.withData({ ids: id }),
                    `${abstract}.restoreMany`,
                );
            }
    
            const Model = ModelFacade.make(abstract);
    
            const model = new Model({ id });
    
            return model.restore();
        }
    
        static forceDelete(id: number | string): Promise<Response>;
        static forceDelete(id: Array<number | string>): Promise<Response>;
        static forceDelete(id: number | string | Array<number | string>) {
            if (Array.isArray(id)) {
                return Route.call(
                    `luminix.${abstract}.destroyMany`, 
                    (client) => client.withQueryParameters({ ids: id, force: true }),
                    `${abstract}.forceDeleteMany`,
                );
            }
    
            const Model = ModelFacade.make(abstract);
    
            const model = new Model({ id });
    
            return model.forceDelete();
        }

        static singular() {
            return ModelFacade.schema(abstract).displayName.singular;
        }

        static plural() {
            return ModelFacade.schema(abstract).displayName.plural;
        }
    };

}

export function ModelFactory(ModelFacade: ModelFacade, abstract: string, CustomModel: typeof BaseModel): typeof ModelInterface {
    return class extends CustomModel {

        [Symbol.toStringTag] = Str.studly(abstract);

        constructor(attributes: JsonObject = {}) {
            super(attributes);

            return new Proxy(this, {
                get: (target: ModelInterface, prop) => {

                    if (prop === '__isModel') {
                        return true;
                    }

                    // If the property exists in the target, return it.
                    if (Reflect.has(target, prop) || typeof prop !== 'string') {
                        return Reflect.get(target, prop);
                    }

                    // If the property exists in attributes, return it.
                    if (Object.keys(target.attributes).includes(prop)) {
                        return target.getAttribute(prop);
                    }
                    // If the property is a relation, return it.
                    if (Object.keys(target.relations).includes(prop)) {
                        return target.relations[prop].getLoadedItems();
                    }
                    // If is calling the relation method, return it.
                    if (prop.endsWith('Relation') && Object.keys(target.relations).includes(Str.snake(prop.slice(0, -8)))) {
                        return () => target.relation(prop.slice(0, -8));
                    }

                    // If there is a reducer to handle a property, return it.
                    if (ModelFacade.hasReducer(`model${Str.studly(target.getType())}Get${Str.studly(prop)}Attribute`)) {
                        const reducer = ModelFacade[`model${Str.studly(target.getType())}Get${Str.studly(prop)}Attribute`];
                        if (typeof reducer !== 'function') {
                            throw new NotReducibleException('ModelFacade');
                        }
                        // !Reducer `model${ClassName}Get${Key}Attribute`
                        return reducer.bind(ModelFacade)(undefined, target);
                    }

                    return Reflect.get(target, prop);
                },
                set: (target, prop: string, value) => {
                    if (prop in target && typeof target[prop] !== 'function') {
                        return Reflect.set(target, prop, value);
                    }
                    target.setAttribute(
                        Str.snake(prop),
                        value
                    );
                    return true;
                },
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;

    };

}
