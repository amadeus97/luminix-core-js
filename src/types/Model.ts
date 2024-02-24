
import { AxiosResponse } from "axios";

type RelationRepository = {
    [relationName: string]: Model | Model[]
}

export declare class Model extends EventTarget {
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
    setAttribute(key: string, value: any): void;
    getKey(): string | number;
    getKeyName(): string;
    fill(attributes: object): void;
    json(): unknown;
    diff(): object;
    save(options?: ModelSaveOptions): Promise<AxiosResponse<any, any>>;
    delete(): Promise<AxiosResponse<any, any>>;
    forceDelete(): Promise<AxiosResponse<any, any>>;
    restore(): Promise<AxiosResponse<any, any>>;

    static getSchemaName(): string;
    static getSchema(): ModelSchemaAttributes;
    static get(query: object): Promise<ModelPaginatedResponse>;
    static find(id: number): Promise<Model>;
    static create(attributes: JsonObject): Promise<Model>;
    static update(id: number, attributes: JsonObject): Promise<Model>;
    static delete(id: number): Promise<AxiosResponse>;
    static delete(ids: Array<number>): Promise<AxiosResponse>;
    static restore(id: number): Promise<AxiosResponse>;
    static restore(ids: Array<number>): Promise<AxiosResponse>;
    static forceDelete(id: number): Promise<AxiosResponse>;
    static forceDelete(ids: Array<number>): Promise<AxiosResponse>;

}

export declare class ProxyModel extends Model {
    [key: string]: any;
}

export interface ModelSaveOptions {
    additionalPayload?: object,
    sendsOnlyModifiedFields?: boolean,
}

export interface JsonObject {
    [key: string]: string | number | boolean | null | JsonObject | Array<string | number | boolean | null | JsonObject>,
}

export type ModelSetAttributeCallback = (attributeName: string, value: any) => void;

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
    [className: string]: ModelSchemaAttributes;
}

export type ModelPaginatedResponse = {
    current_page: number,
    data: Model[],
    first_page_url: string,
    from: number,
    last_page: number,
    last_page_url: string,
    links: Array<{
        url: string,
        label: string,
        active: boolean,
    }>,
    next_page_url: string | null,
    path: string,
    per_page: number,
    prev_page_url: string | null,
    to: number,
    total: number,
}

export type RepositoryFacade = {
    schema(): ModelSchema;
    schema(className: string): ModelSchemaAttributes;
    make(): {
        [className: string]: typeof Model;
    };
    make(className: string): typeof Model;
    addEventListener(event: string, listener: (e: Event) => void): void;
    removeEventListener(event: string, listener: (e: Event) => void): void;
    dispatchEvent(event: Event): void;
    
}

