

// import { BaseModel } from "../internals/BaseModel";
// import { ModelRepository } from "../internals/singletons/ModelRepository";
// import { FormFieldDefinition } from "./form";
import BaseModel from "../contracts/Model";
import Repository from "../containers/Repository";

export interface ModelMaker {
    modelRepository: Repository,
    className: string,
}

export interface ModelSaveOptions {
    additionalPayload?: object,
    silent?: boolean,
    sendsOnlyModifiedFields?: boolean,
}

export interface ModelAttributes {
    [key: string]: string | number | boolean | object | null | undefined,
}

export interface ModelConstructorAttributes {
    id?: number,
    created_at?: string,
    updated_at?: string,
    deleted_at?: string,
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
    fields: {
        [fieldSchema: string]: Array<any>
    },
    fillable: string[],
    relations: {
        [relationName: string]: {
            model: string,
            type: 'HasOne' | 'HasMany' | 'BelongsTo' | 'BelongsToMany' | 'MorphOne' | 'MorphMany' | 'MorphTo' | 'MorphToMany' | 'MorphedByMany',
        }
    },
    tables: {
        [tableName: string]: {
            columns: Array<ModelTableColumnDefinition>,
            filter?: Array<any>,
        }
    },
    web: string[],
    softDelete?: boolean,
    class: string,
    importable?: boolean,
    exportable?: boolean,
    casts?: {
        [field: string]: string,
    },
}

export interface ModelSchema {
    [className: string]: ModelSchemaAttributes;
}

export declare class Model extends BaseModel {
    constructor(attributes?: ModelConstructorAttributes);
    static getSchemaName(): string;
    static getSchema(): ModelSchemaAttributes;
    [key: string]: any,
}

type ModelHelperWithoutArguments = () => Repository;

type ModelHelperWithArguments = (className?: string) => typeof Model;

export type ModelHelper = ModelHelperWithoutArguments & ModelHelperWithArguments;
