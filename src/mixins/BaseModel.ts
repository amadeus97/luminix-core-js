
import _ from 'lodash';
import PropertyBag from '../contracts/PropertyBag';

import { 
    BaseModel, ModelSaveOptions, ModelSchemaAttributes,
    ModelPaginatedResponse, Model as ModelInterface, RelationRepository, ModelEvents,
    Model,
} from '../types/Model';

import { AppFacade, AppFacades } from '../types/App';
import { RouteGenerator, RouteReplacer } from '../types/Route';
import { JsonObject, JsonValue } from '../types/Support';

import { AxiosResponse } from 'axios';
import { HasEvents } from './HasEvents';
import { Unsubscribe } from 'nanoevents';

import Builder from '../contracts/Builder';
import Relation from '../contracts/Relation';

import NotReducibleException from '../exceptions/NotReducibleException';
import MethodNotImplementedException from '../exceptions/MethodNotImplementedException';
import ModelNotPersistedException from '../exceptions/ModelNotPersistedException';
import { BuilderInterface as BuilderBase, Scope as ScopeBase, ExtendedOperator } from '../types/Builder';
import { Collection } from '../types/Collection';

type BuilderInterface = BuilderBase<ModelInterface, ModelPaginatedResponse>;
type Scope = ScopeBase<ModelInterface, ModelPaginatedResponse>;


export function BaseModelFactory(app: AppFacade, abstract: string): typeof BaseModel {

    class ModelRaw {

        private _attributes: PropertyBag<JsonObject> = new PropertyBag({});
        private _original: JsonObject = {};
        private _relations: RelationRepository = {};
        private _changedKeys: string[] = [];
        
        public exists = false;

        static name = _.upperFirst(_.camelCase(abstract));

        [Symbol.toStringTag] = _.upperFirst(_.camelCase(abstract));

        constructor(attributes: JsonObject = {}) {
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
            const { relations } = app.make('model').schema(abstract);
    
            this._relations = {};

            if (!relations) {
                return;
            }

            // !Reducer `relationMap`
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const relationMap: Record<string, typeof Relation> = (app.make('model').relationMap as any)({}, abstract);
    
            Object.entries(relations).forEach(([key, relation]) => {
                const { type } = relation;

                const RelationClass = type in relationMap
                    ? relationMap[type]
                    : Relation;

                this._relations[key] = new RelationClass(
                    { name: key, ...relation },
                    app.make(),
                    this,
                    null,
                );
            });
        }
    
        private makeAttributes(attributes: JsonObject)
        {
            const { relations } = app.make('model').schema(abstract);
    
            // remove relations from attributes
            const excludedKeys = Object.keys(relations || {});
            const newAttributes: JsonObject = _.omit(attributes, excludedKeys);
    
            // fill missing fillable attributes with null
            this.fillable.filter((key) => !(key in newAttributes)).forEach((key) => {
                newAttributes[key] = null;
            });
    
            if (relations) {
                Object.keys(relations).forEach((key) => {
                    this.relation(_.camelCase(key))!.make(attributes[key]);
                });
            }

            if (!this.validateJsonObject(newAttributes)) {
                if (app.isProduction()) {
                    throw new TypeError(`[Luminix] Invalid attributes for model "${abstract}"`);
                } else {
                    app.make('log').warning(`Invalid attributes for model "${abstract}".
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
                [this.primaryKey]: this.getAttribute(this.primaryKey) as string
            };
        }
    
        private dispatchChangeEvent(change: JsonObject) {
            this.emit('change', {
                value: change,
            });
        }
    
        private dispatchCreateEvent(attributes: JsonObject) {
            this.emit('create', {
                value: attributes,
            });
    
            app.make('model').emit('create', {
                class: abstract,
                model: this,
            });
        }
    
        private dispatchUpdateEvent(attributes: JsonObject) {
            this.emit('update', {
                value: attributes,
            });
    
            app.make('model').emit('update', {
                class: abstract,
                model: this,
            });
        }
    
        private dispatchSaveEvent() {
            this.emit('save', {
                value: this.diff(),
            });
    
            app.make('model').emit('save', {
                class: abstract,
                model: this,
            });
        }
    
        private dispatchDeleteEvent(force = false) {
            this.emit('delete', {
                force,
                [this.getKeyName()]: this.getKey(),
            });
    
            app.make('model').emit('delete', {
                class: abstract,
                model: this,
                force,
            });
        }
    
        private dispatchRestoreEvent() {
            this.emit('restore', {
                value: this.attributes,
            });
    
            app.make('model').emit('restore', {
                class: abstract,
                model: this,
            });
        }
    
        private dispatchErrorEvent(error: unknown, operation: 'save' | 'delete' | 'restore' | 'forceDelete') {
            this.emit('error', {
                error,
                operation,
            });
    
            app.make('model').emit('error', {
                class: abstract,
                model: this,
                error,
                operation,
            });
        }

        private updateChangedKeys(key: string) {

            const determineValueEquality = (a: unknown, b: unknown) => {
                if (typeof a === 'object' && a !== null) {
                    return _.isEqual(a, b);
                }

                return a == b;
            };

            if (!this._changedKeys.includes(key) && !determineValueEquality(_.get(this._original, key), this._attributes.get(key))) {
                this._changedKeys.push(key);
            } else if (this._changedKeys.includes(key) && determineValueEquality(_.get(this._original, key), this._attributes.get(key))) {
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
            return app.make('model').schema(abstract).fillable;
        }
    
        get primaryKey() {
            return app.make('model').schema(abstract).primaryKey;
        }
    
        get timestamps() {
            return app.make('model').schema(abstract).timestamps;
        }
    
        // get softDeletes() {
        //     return app.make('model').schema(abstract).softDeletes;
        // }
    
        get casts(): ModelSchemaAttributes['casts'] {
            return {
                ...app.make('model').schema(abstract).casts,
                ...this.timestamps ? { created_at: 'datetime', updated_at: 'datetime' } : {},
                // ...this.softDeletes ? { deleted_at: 'datetime' } : {},
            };
        }
    
        get isDirty() 
        {
            return this._changedKeys.length > 0;
        }
    
        getAttribute(key: string) {
            let value = this._attributes.get(key, null);
            if (key in this.casts) {
                value = this.cast(value, this.casts[key]);
            }
            const reducer = app.make('model')[`model${_.upperFirst(_.camelCase(abstract))}Get${_.upperFirst(_.camelCase(key))}Attribute`];
            if (typeof reducer !== 'function') {
                throw new NotReducibleException('ModelFacade');
            }
            // !Reducer `model${ClassName}Get${Key}Attribute`
            return reducer.bind(app.make('model'))(value, this);
        }
    
        setAttribute(key: string, value: unknown) {
            // if (!this.fillable.includes(key)) {
            //     if (app.isProduction()) {
            //         throw new AttributeNotFillableException(abstract, key);
            //     } else {
            //         app.make('log').warning(`[Luminix] Trying to set a non-fillable attribute "${key}" in model "${abstract}". This will throw an error in production.`);
            //     }
            //     return;
            // }

            const reducer = app.make('model')[`model${_.upperFirst(_.camelCase(abstract))}Set${_.upperFirst(_.camelCase(key))}Attribute`];
            if (typeof reducer !== 'function') {
                throw new NotReducibleException('ModelFacade');
            }

            // !Reducer `model${ClassName}Set${Key}Attribute`
            const mutated = reducer.bind(app.make('model'))(
                this.mutate(value, this.casts[key]),
                this
            );
    
            if (!this.validateJsonObject({ [key]: mutated })) {
                if (app.isProduction()) {
                    throw new TypeError(`[Luminix] Attribute "${key}" in model "${abstract}" must be a boolean, number, string or null`);
                } else {
                    app.make('log').warning(`Invalid type for attribute "${key}" in model "${abstract}" after mutation.
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
            const validAttributes = _.pick(attributes, this.fillable);
    
            const mutatedAttributes = Object.entries(validAttributes).reduce((acc: JsonObject, [key, value]) => {
                const reducer = app.make('model')[`model${_.upperFirst(_.camelCase(abstract))}Set${_.upperFirst(_.camelCase(key))}Attribute`];
                if (typeof reducer !== 'function') {
                    throw new NotReducibleException('ModelFacade');
                }
                // !Reducer `model${ClassName}Set${Key}Attribute`
                acc[key] = reducer.bind(app.make('model'))(
                    this.mutate(value, this.casts[key]),
                    this
                );
                return acc;
            }, {});
    
            if (!this.validateJsonObject(mutatedAttributes)) {
                if (app.isProduction()) {
                    throw new TypeError(`[Luminix] Invalid attributes for model "${abstract}"`);
                } else {
                    app.make('log').warning(`Invalid attributes for model "${abstract}" after mutation.
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
            app.make('log').info({
                ...this.toJson(),
                [Symbol.toStringTag]: _.upperFirst(_.camelCase(abstract)),
            });
        }
    
        toJson() {  
            const relations = Object.entries(this.relations).reduce((acc, [key, relation]) => {
                if (!relation.isLoaded()) {
                    return acc;
                }

                if (relation.isSingle()) {
                    acc[_.snakeCase(key)] = (relation.getLoadedItems() as Model).toJson();
                } else if (relation.isMultiple()) {
                    acc[_.snakeCase(key)] = (relation.getLoadedItems() as Collection<Model>).map((item) => item.toJson()).all();
                }

                return acc;
            }, {} as JsonObject);

            const reducer = app.make('model')[`model${_.upperFirst(_.camelCase(abstract))}Json`];

            if (typeof reducer !== 'function') {
                throw new NotReducibleException('ModelFacade');
            }

            // !Reducer `model${ClassName}Json`
            return reducer.bind(app.make('model'))({
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
            if (name !== _.camelCase(name)) {
                return undefined;
            }
            return this.relations[_.snakeCase(name)];
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

        getRouteForRestore(): RouteGenerator {
            return [
                `luminix.${abstract}.restore`,
                this.makePrimaryKeyReplacer(),
            ];
        }

        getRouteForForceDelete(): RouteGenerator {
            return [
                `luminix.${abstract}.forceDelete`,
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

            const { labeledBy } = app.make('model').schema(abstract);

            return this.getAttribute(labeledBy) as string;
        }

        async refresh() {
            if (!this.exists) {
                throw new ModelNotPersistedException(abstract, 'refresh');
            }
            const { data } = await app.make('route').call(
                this.getRouteForRefresh(),
                { errorBag: this.getErrorBag('fetch') }
            );

            this.makeAttributes(data);
        }
    
        async save(options: ModelSaveOptions = {}): Promise<AxiosResponse|void> {
            try {
                const {
                    additionalPayload = {},
                    sendsOnlyModifiedFields = true,
                } = options;
    
                const exists = this.exists;

                const data = {
                    ..._.pick(
                        sendsOnlyModifiedFields && exists
                            ? this.diff()
                            : this.attributes,
                        this.fillable
                    ),
                    ...additionalPayload,
                };

                if (_.isEmpty(data)) {
                    return;
                }
    
                const response = await app.make('route').call(
                    this.getRouteForSave(),
                    {
                        data,
                        errorBag: this.getErrorBag(exists ? 'update' : 'store'),
                    }
                );
    
                if ([200, 201].includes(response.status)) {
                    this.makeAttributes(response.data);
                    this.exists = true;
                    this.dispatchSaveEvent();
                    if (!exists) {
                        this.dispatchCreateEvent(response.data);
                    } else {
                        this.dispatchUpdateEvent(response.data);
                    }
                    
                    return response;
                }
    
                throw response;
            } catch (error) {
                this.dispatchErrorEvent(error, 'save');
                throw error;
            }
        }

        async push(): Promise<AxiosResponse> {
            throw new MethodNotImplementedException();
        }
    
        async delete(): Promise<AxiosResponse> {
            try {
                const response = await app.make('route').call(
                    this.getRouteForDelete(),
                    { errorBag: this.getErrorBag('delete') }
                );
    
                if (response.status === 204) {
                    this.dispatchDeleteEvent();
                    return response;
                }
    
                throw response;
            } catch (error) {
                this.dispatchErrorEvent(error, 'delete');
                throw error;
            }
        }

        async update(data: JsonObject): Promise<void> {
            try {
                const response = await app.make('route').call(
                    this.getRouteForUpdate(), 
                    {
                        data,
                        errorBag: this.getErrorBag('update'),
                    });

                if (response.status === 200) {
                    this.makeAttributes(response.data);
                    this.dispatchUpdateEvent(response.data);
                    return;
                }

                throw response;
            } catch (error) {
                this.dispatchErrorEvent(error, 'save');
                throw error;
            }

        }
    
        async forceDelete(): Promise<AxiosResponse> {
            try {
                const response = await app.make('route').call(
                    this.getRouteForForceDelete(),
                    {
                        params: { force: true },
                        errorBag: this.getErrorBag('forceDelete'),
                    }
                );
    
                if (response.status === 204) {
                    this.dispatchDeleteEvent(true);
                    return response;
                }
    
                throw response;
            } catch (error) {
                this.dispatchErrorEvent(error, 'forceDelete');
                throw error;
            }
        }
    
        async restore(): Promise<AxiosResponse> {
            try {
                const response = await app.make('route').call(
                    this.getRouteForRestore(),
                    {
                        params: { restore: true },
                        errorBag: this.getErrorBag('restore'),
                    }
                );
    
                if (response.status === 200) {
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
            return app.make('model').schema(abstract);
        }

        static query() {
            return new Builder(app.make(), abstract);
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
            const Model = app.make('model').make(abstract);
            const model = new Model();
    
            model.fill(attributes);
    
            await model.save();
    
            return model;
        }
    
        static async update(id: number | string, attributes: JsonObject) {
            const Model = app.make('model').make(abstract);
            const model = new Model({ id });
    
            model.fill(attributes);
            model.exists = true;
    
            await model.save();
    
            return model;
        }
    
        static delete(id: number | string): Promise<AxiosResponse>;
        static delete(id: Array<number | string>): Promise<AxiosResponse>;
        static delete(id: number | string | Array<number | string>) {
            if (Array.isArray(id)) {
                return app.make('route').call(`luminix.${abstract}.destroyMany`, {
                    params: { ids: id },
                    errorBag: `${abstract}.deleteMany`,
                });
            }
    
            const Model = app.make('model').make(abstract);
            const model = new Model({ id });
    
            return model.delete();
        }
    
        static async restore(id: number | string): Promise<AxiosResponse>;
        static async restore(id: Array<number | string>): Promise<AxiosResponse>;
        static async restore(id: number | string | Array<number | string>) {
            if (Array.isArray(id)) {
                return app.make('route').call(`luminix.${abstract}.restoreMany`, {
                    data: { ids: id },
                    errorBag: `${abstract}.restoreMany`,
                });
            }
    
            const Model = app.make('model').make(abstract);
    
            const model = new Model({ id });
    
            return model.restore();
        }
    
        static forceDelete(id: number | string): Promise<AxiosResponse>;
        static forceDelete(id: Array<number | string>): Promise<AxiosResponse>;
        static forceDelete(id: number | string | Array<number | string>) {
            if (Array.isArray(id)) {
                return app.make('route').call(`luminix.${abstract}.destroyMany`, {
                    params: { ids: id, force: true },
                    errorBag: `${abstract}.forceDeleteMany`,
                });
            }
    
            const Model = app.make('model').make(abstract);
    
            const model = new Model({ id });
    
            return model.forceDelete();
        }

        static singular() {
            return app.make('model').schema(abstract).displayName.singular;
        }

        static plural() {
            return app.make('model').schema(abstract).displayName.plural;
        }

        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        on<E extends keyof ModelEvents>(_: E, __: ModelEvents[E]): Unsubscribe {
            throw new MethodNotImplementedException();
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        once<E extends keyof ModelEvents>(_: E, __: ModelEvents[E]): void {
            throw new MethodNotImplementedException();
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        emit<E extends keyof ModelEvents>(_: E, __?: Omit<Parameters<ModelEvents[E]>[0], 'source'>): void {
            throw new MethodNotImplementedException();
        }
    }

    return HasEvents<ModelEvents, typeof ModelRaw>(ModelRaw);
}

export function ModelFactory(facades: AppFacades, abstract: string, CustomModel: typeof BaseModel): typeof ModelInterface {
    return class extends CustomModel {

        [Symbol.toStringTag] = _.upperFirst(_.camelCase(abstract));

        constructor(attributes: JsonObject = {}) {
            super(attributes);

            return new Proxy(this, {
                get: (target: ModelInterface, prop: string) => {

                    if (prop === '__isModel') {
                        return true;
                    }

                    // If the property exists in the target, return it.
                    if (prop in target) {
                        return Reflect.get(target, prop);
                    }

                    // If the prop is not camel cased, return undefined.
                    if (prop !== _.camelCase(prop)) {
                        return undefined;
                    }

                    const snakeCasedProp = _.snakeCase(prop);

                    // If the property exists in attributes, return it.
                    if (Object.keys(target.attributes).includes(snakeCasedProp)) {
                        return target.getAttribute(snakeCasedProp);
                    }
                    // If the property is a relation, return it.
                    if (Object.keys(target.relations).includes(snakeCasedProp)) {
                        return target.relations[snakeCasedProp].getLoadedItems();
                    }
                    // If is calling the relation method, return it.
                    if (prop.endsWith('Relation') && Object.keys(target.relations).includes(_.snakeCase(prop.slice(0, -8)))) {
                        return () => target.relation(prop.slice(0, -8));
                    }


                    // If there is a reducer to handle a property, return it.
                    if (facades.model.hasReducer(`model${target.constructor.name}Get${_.upperFirst(prop)}Attribute`)) {
                        const reducer = facades.model[`model${target.constructor.name}Get${_.upperFirst(prop)}Attribute`];
                        if (typeof reducer !== 'function') {
                            throw new NotReducibleException('ModelFacade');
                        }
                        // !Reducer `model${ClassName}Get${Key}Attribute`
                        return reducer.bind(facades.model)(undefined, target);
                    }

                    return Reflect.get(target, prop);
                },
                set: (target, prop: string, value) => {
                    if (prop in target && typeof target[prop] !== 'function') {
                        return Reflect.set(target, prop, value);
                    }
                    target.setAttribute(
                        _.snakeCase(prop),
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
