
import { AxiosResponse } from 'axios';
import { EventSource, Event } from './Event';
import { ReducibleInterface } from './Reducer';
import { AppFacade } from './App';

export type RelationRepository = {
    [relationName: string]: Model | Model[]
}

export type ModelEvents = {
    'change': (e: ModelChangeEvent) => void,
    'save': (e: ModelSaveEvent) => void,
    'delete': (e: ModelDeleteEvent) => void,
    'restore': (e: ModelRestoreEvent) => void,
    'create': (e: ModelSaveEvent) => void,
    'update': (e: ModelSaveEvent) => void,
    'error': (e: ModelErrorEvent) => void,
}

export type GlobalModelEvents = {
    'save': (e: ModelGlobalEvent) => void,
    'delete': (e: ModelGlobalEvent) => void,
    'restore': (e: ModelGlobalEvent) => void,
    'create': (e: ModelGlobalEvent) => void,
    'update': (e: ModelGlobalEvent) => void,
    'fetch': (e: ModelGlobalEvent) => void,
    'error': (e: ModelGlobalErrorEvent) => void,
}

export type ModelChangeEvent = Event<BaseModel> & {
    value: JsonObject,
}

export type ModelSaveEvent = Event<BaseModel> & {
    value: JsonObject,
}

export type ModelDeleteEvent = Event<BaseModel> & {
    force: boolean,
}

export type ModelRestoreEvent = Event<BaseModel> & {
    value: JsonObject,
}

export type ModelErrorEvent = Event<BaseModel> & {
    error: unknown,
    operation: 'save' | 'delete' | 'restore' | 'forceDelete',
}

export type ModelGlobalEvent = Event<RepositoryFacade> & {
    class: string,
    model: BaseModel,
    force?: boolean,
};

export type ModelGlobalErrorEvent = ModelGlobalEvent & {
    error: unknown,
    operation: 'save' | 'delete' | 'restore' | 'forceDelete',
};


export declare class BaseModel implements EventSource<ModelEvents> {

    // emitter: Emitter<EventSourceEvents>;

    constructor(attributes?: JsonObject);

    get attributes(): JsonObject;
    get original(): JsonObject;
    get primaryKey(): string;
    get timestamps(): boolean;
    get softDeletes(): boolean;
    get fillable(): string[];
    get relations(): RelationRepository;
    get exists(): boolean;
    get isDirty(): boolean;
    get casts(): ModelSchemaAttributes['casts'];

    getAttribute(key: string): unknown;
    setAttribute(key: string, value: unknown): void;
    getKey(): string | number;
    getKeyName(): string;
    fill(attributes: JsonObject): void;
    json(): JsonObject;
    diff(): JsonObject;
    save(options?: ModelSaveOptions): Promise<AxiosResponse<unknown, unknown>>;
    delete(): Promise<AxiosResponse<unknown, unknown>>;
    forceDelete(): Promise<AxiosResponse<unknown, unknown>>;
    restore(): Promise<AxiosResponse<unknown, unknown>>;

    static getSchemaName(): string;
    static getSchema(): ModelSchemaAttributes;
    static get(query?: Record<string, unknown>): Promise<ModelPaginatedResponse>;
    static find(id: number | string): Promise<Model>;
    static create(attributes: JsonObject): Promise<Model>;
    static update(id: number | string, attributes: JsonObject): Promise<Model>;
    static delete(id: number | string): Promise<AxiosResponse>;
    static delete(ids: Array<number | string>): Promise<AxiosResponse>;
    static restore(id: number | string): Promise<AxiosResponse>;
    static restore(ids: Array<number | string>): Promise<AxiosResponse>;
    static forceDelete(id: number | string): Promise<AxiosResponse>;
    static forceDelete(ids: Array<number | string>): Promise<AxiosResponse>;

    on: EventSource<ModelEvents>['on'];
    once: EventSource<ModelEvents>['once'];
    emit: EventSource<ModelEvents>['emit'];
}

export declare class Model extends BaseModel {
    [key: string]: unknown;
}

export interface ModelSaveOptions {
    additionalPayload?: object,
    sendsOnlyModifiedFields?: boolean,
}

export type JsonObject = {
    [key: string]: JsonValue,
}

export type JsonValue = string | number | boolean | null | JsonObject | Array<string | number | boolean | null | JsonObject>;

export type ModelFillCallback = (data: object) => void;

export type ModelJsonCallback = () => object;

export type ModelDiffCallback = () => object | false;

export type ModelSaveCallback = (options?: ModelSaveOptions) => Promise<boolean>;

export interface ModelTableColumnDefinition {
    key: string,
    label: string,
    sortable?: boolean,
}

export interface ModelSchemaAttributes {
    fillable: string[],
    relations: {
        [relationName: string]: {
            model: string,
            type: 'HasOne' | 'HasMany' | 'BelongsTo' | 'BelongsToMany' | 'MorphOne' | 'MorphMany' | 'MorphTo' | 'MorphToMany' | 'MorphedByMany',
        }
    },
    casts: {
        [field: string]: string,
    },
    primaryKey: string,
    timestamps: boolean,
    softDeletes: boolean,
    importable?: boolean,
    exportable?: boolean,
}

export interface ModelSchema {
    [abstract: string]: ModelSchemaAttributes;
}

export type ModelPaginatedResponse = {
    data: Model[],
    links: {
        first: string,
        last: string,
        prev: string | null,
        next: string | null,
    },
    meta: {
        current_page: number,
        from: number,
        last_page: number,
        path: string,
        per_page: number,
        to: number,
        total: number,
        links: Array<{
            url: string | null,
            label: string,
            active: boolean,
        }>,
    }
}

export type RepositoryFacade = EventSource<GlobalModelEvents> & ReducibleInterface & {
    schema(): ModelSchema;
    schema(abstract: string): ModelSchemaAttributes;
    make(): {
        [abstract: string]: typeof Model;
    };
    make(abstract: string): typeof Model;
    boot(app: AppFacade): void;
    
}

