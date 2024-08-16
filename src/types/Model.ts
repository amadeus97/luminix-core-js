
import { AxiosResponse } from 'axios';
import { EventSource, Event } from './Event';

import { Collection } from './Collection';

import { RelationInterface, BuilderInterface, Scope, ExtendedOperator } from './Relation';
import { JsonObject, JsonValue } from './Support';
import { RouteGenerator } from './Route';

export type RelationRepository = Record<string, RelationInterface<Model, ModelPaginatedResponse>>;

export type ModelEvents = {
    'change': (e: ModelChangeEvent) => void,
    'save': (e: ModelSaveEvent) => void,
    'delete': (e: ModelDeleteEvent) => void,
    'restore': (e: ModelRestoreEvent) => void,
    'create': (e: ModelSaveEvent) => void,
    'update': (e: ModelSaveEvent) => void,
    'error': (e: ModelErrorEvent) => void,
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


export declare class BaseModel implements EventSource<ModelEvents> {

    // emitter: Emitter<EventSourceEvents>;

    constructor(attributes?: JsonObject);

    get attributes(): JsonObject;
    get original(): JsonObject;
    get primaryKey(): string;
    get timestamps(): boolean;
    // get softDeletes(): boolean;
    get fillable(): string[];
    get relations(): RelationRepository;
    get isDirty(): boolean;
    get casts(): ModelSchemaAttributes['casts'];

    exists: boolean;
    wasRecentlyCreated: boolean;

    getAttribute(key: string): unknown;
    setAttribute(key: string, value: unknown): void;
    getKey(): string | number;
    getKeyName(): string;
    getLabel(): string;
    fill(attributes: object): void;
    toJson(): JsonObject;
    diff(): JsonObject;
    getType(): string;
    dump(): void;
    save(options?: ModelSaveOptions): Promise<AxiosResponse|void>;
    update(attributes: JsonObject): Promise<void>;
    delete(): Promise<AxiosResponse>;
    forceDelete(): Promise<AxiosResponse>;
    restore(): Promise<AxiosResponse>;
    refresh(): Promise<void>;
    relation(relationName: string): RelationInterface<Model, ModelPaginatedResponse> | undefined;

    getErrorBag(method: string): string;

    getRouteForSave(): RouteGenerator;
    getRouteForUpdate(): RouteGenerator;
    getRouteForDelete(): RouteGenerator;
    getRouteForForceDelete(): RouteGenerator;
    getRouteForRefresh(): RouteGenerator;

    static getSchemaName(): string;
    static getSchema(): ModelSchemaAttributes;

    static query(): BuilderInterface<Model, ModelPaginatedResponse>;
    static get(page?: number, replaceLinksWith?: string): Promise<ModelPaginatedResponse>;
    static find(id: number | string): Promise<Model | null>;
    static first(): Promise<Model | null>;

    static where(scope: Scope<Model, ModelPaginatedResponse>): BuilderInterface<Model, ModelPaginatedResponse>;
    static where(key: string, value: JsonValue): BuilderInterface<Model, ModelPaginatedResponse>;
    static where(key: string, operator: ExtendedOperator, value: JsonValue): BuilderInterface<Model, ModelPaginatedResponse>;
    static where(key: string | Scope<Model, ModelPaginatedResponse>, operatorOrValue?: ExtendedOperator | JsonValue, value?: JsonValue): BuilderInterface<Model, ModelPaginatedResponse>;

    static whereNull(key: string): BuilderInterface<Model, ModelPaginatedResponse>;
    static whereNotNull(key: string): BuilderInterface<Model, ModelPaginatedResponse>;
    static whereBetween(key: string, value: [JsonValue, JsonValue]): BuilderInterface<Model, ModelPaginatedResponse>;
    static whereNotBetween(key: string, value: [JsonValue, JsonValue]): BuilderInterface<Model, ModelPaginatedResponse>;

    static orderBy(column: string, direction?: 'asc' | 'desc'): BuilderInterface<Model, ModelPaginatedResponse>;
    static searchBy(term: string): BuilderInterface<Model, ModelPaginatedResponse>;
    static minified(): BuilderInterface<Model, ModelPaginatedResponse>;
    static limit(value: number): BuilderInterface<Model, ModelPaginatedResponse>;

    static create(attributes: JsonObject): Promise<Model>;
    static update(id: number | string, attributes: JsonObject): Promise<Model>;
    static delete(id: number | string): Promise<AxiosResponse>;
    static delete(ids: Array<number | string>): Promise<AxiosResponse>;
    static restore(id: number | string): Promise<AxiosResponse>;
    static restore(ids: Array<number | string>): Promise<AxiosResponse>;
    static forceDelete(id: number | string): Promise<AxiosResponse>;
    static forceDelete(ids: Array<number | string>): Promise<AxiosResponse>;


    static singular(): string;
    static plural(): string;

    on: EventSource<ModelEvents>['on'];
    once: EventSource<ModelEvents>['once'];
    emit: EventSource<ModelEvents>['emit'];
}

export declare class Model extends BaseModel {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;

    [Symbol.toStringTag]: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //static [key: string]: any;
}

export interface ModelSaveOptions {
    additionalPayload?: object,
    sendsOnlyModifiedFields?: boolean,
}


export type ModelFillCallback = (data: object) => void;

export type ModelJsonCallback = () => object;

export type ModelDiffCallback = () => object | false;

export type ModelSaveCallback = (options?: ModelSaveOptions) => Promise<boolean>;

export interface ModelTableColumnDefinition {
    key: string,
    label: string,
    sortable?: boolean,
}

export type ModelAttribute = {
    appended: true | null,
    cast: string | null,
    default: string | null,
    fillable: boolean,
    hidden: boolean,
    increments: boolean,
    name: string,
    nullable: boolean,
    phpType: string | null,
    primary: boolean,
    type: string | null,
    unique: boolean,
    virtual: boolean,
};

export interface ModelSchemaAttributes {
    attributes: ModelAttribute[],
    displayName: {
        singular: string,
        plural: string,
    },
    fillable: string[],
    relations: Record<string, Omit<RelationMetaData, 'name'>>,
    casts: Record<string, string>,
    primaryKey: string,
    timestamps: boolean,
    labeledBy: string,
    softDeletes: boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any,
    // importable?: boolean,
    // exportable?: boolean,
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
    where?: JsonObject;
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
        per_page: number,
        to: number,
        total: number,
        links: Array<ModelPaginatedLink>,
    }
}

