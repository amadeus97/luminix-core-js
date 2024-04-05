
import { AxiosResponse } from 'axios';
import { EventSource, Event } from './Event';
import { ReducibleInterface } from './Reducer';
import { AppFacade } from './App';
import { Collection } from './Collection';
import { BuilderInterface, Scope, ExtendedOperator } from './Builder';
import Relation from '../contracts/Relation';


export type RelationRepository = Record<string, Relation>;

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

export type ModelGlobalEvent = Event<ModelFacade> & {
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
    get isDirty(): boolean;
    get casts(): ModelSchemaAttributes['casts'];

    exists: boolean;

    getAttribute(key: string): unknown;
    setAttribute(key: string, value: unknown): void;
    getKey(): string | number;
    getKeyName(): string;
    fill(attributes: JsonObject): void;
    json(): JsonObject;
    diff(): JsonObject;
    getType(): string;
    save(options?: ModelSaveOptions): Promise<AxiosResponse<unknown, unknown>>;
    update(attributes: JsonObject): Promise<void>;
    delete(): Promise<AxiosResponse<unknown, unknown>>;
    forceDelete(): Promise<AxiosResponse<unknown, unknown>>;
    restore(): Promise<AxiosResponse<unknown, unknown>>;
    refresh(): Promise<void>;
    relation(relationName: string): Relation;

    static getSchemaName(): string;
    static getSchema(): ModelSchemaAttributes;

    static query(): BuilderInterface;
    static get(page?: number, replaceLinksWith?: string): Promise<ModelPaginatedResponse>;
    static find(id: number | string): Promise<Model | null>;
    static first(): Promise<Model | null>;

    static where(scope: Scope): BuilderInterface;
    static where(key: string, value: JsonValue): BuilderInterface;
    static where(key: string, operator: ExtendedOperator, value: JsonValue): BuilderInterface;
    static where(key: string | Scope, operatorOrValue?: ExtendedOperator | JsonValue, value?: JsonValue): BuilderInterface;

    static whereNull(key: string): BuilderInterface;
    static whereNotNull(key: string): BuilderInterface;
    static whereBetween(key: string, value: [JsonValue, JsonValue]): BuilderInterface;
    static whereNotBetween(key: string, value: [JsonValue, JsonValue]): BuilderInterface;

    static orderBy(column: string, direction?: 'asc' | 'desc'): BuilderInterface;
    static searchBy(term: string): BuilderInterface;
    static minified(): BuilderInterface;
    static limit(value: number): BuilderInterface;

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
    relations: Record<string, Omit<RelationMetaData, 'name'>>,
    casts: Record<string, string>,
    primaryKey: string,
    timestamps: boolean,
    softDeletes: boolean,
    importable?: boolean,
    exportable?: boolean,
}

export interface RelationMetaData {
    model: string,
    type: 'HasOne' | 'HasMany' | 'BelongsTo' | 'BelongsToMany' | 'MorphOne' | 'MorphMany' | 'MorphTo' | 'MorphToMany' | 'MorphedByMany',
    foreignKey: string | null,
    name: string,
}


export interface ModelSchema {
    [abstract: string]: ModelSchemaAttributes;
}

export type ModelQuery = JsonObject & {
    q?: string;
    page?: number;
    per_page?: number;
    order_by?: string;
    filters?: JsonObject;
    tab?: string;
    minified?: boolean;
}

export type ModelGetOptions = {
    query?: ModelQuery,
    linkBase?: string,
};

export type ModelPaginatedLink = {
    url: string | null,
    label: string,
    active: boolean,
};

export type ModelPaginatedResponse = {
    data: Collection<Model>,
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
        links: Array<ModelPaginatedLink>,
    }
}

export type ModelFacade = EventSource<GlobalModelEvents> & ReducibleInterface & {
    schema(): ModelSchema;
    schema(abstract: string): ModelSchemaAttributes;
    make(): Record<string, typeof Model>;
    make(abstract: string): typeof Model;
    boot(app: AppFacade): void;
    
}

