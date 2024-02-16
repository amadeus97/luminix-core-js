
import { AxiosResponse } from "axios";

import BaseModel from "../contracts/BaseModel";

export declare class Model extends BaseModel {
    constructor(attributes?: ModelAttributes);
    static getSchemaName(): string;
    static getSchema(): ModelSchemaAttributes;
    static get(query: object): Promise<ModelPaginatedResponse>;
    static find(id: number): Promise<Model>;
    static create(attributes: ModelAttributes): Promise<Model>;
    static update(id: number, attributes: ModelAttributes): Promise<Model>;
    static delete(id: number): Promise<void>;
    static restore(id: number): Promise<Model>;
    static forceDelete(id: number): Promise<void>;
    static massDelete(ids: Array<number>): Promise<AxiosResponse>;
    static massRestore(ids: Array<number>): Promise<AxiosResponse>;
    static massForceDelete(ids: Array<number>): Promise<AxiosResponse>;
    [key: string]: any;
}

export interface ModelSaveOptions {
    additionalPayload?: object,
    sendsOnlyModifiedFields?: boolean,
}

export interface ModelAttributes {
    [key: string]: string | number | boolean | object | null | undefined,
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

type RepositorySchemaWithoutArguments = () => ModelSchema;
type RepositorySchemaWithArguments = (className: string) => ModelSchemaAttributes;

export type RepositorySchemaFunction = RepositorySchemaWithoutArguments & RepositorySchemaWithArguments;

type RepositoryMakeWithoutArguments = () => {
    [className: string]: typeof Model;
};
type RepositoryMakeWithArguments = (className: string) => typeof Model;

export type RepositoryMakeFunction = RepositoryMakeWithoutArguments & RepositoryMakeWithArguments;

export type RepositoryFacade = {
    readonly schema: RepositorySchemaFunction;
    readonly make: RepositoryMakeFunction;
}

type ModelHelperWithoutArguments = () => RepositoryFacade;

type ModelHelperWithArguments = (className: string) => typeof Model;

export type ModelHelper = ModelHelperWithoutArguments & ModelHelperWithArguments;
