import { BuilderInterface, ExtendedOperator, Scope } from './Builder';
import { Collection } from './Collection';
import { BaseModel, JsonValue, Model } from './Model';




export type RelationInterface = {

    guessInverseRelation(): string;

    set(items: Model | Collection<Model> | null): void;

    getForeignKey(): string | null;

    getName(): string;

    getType(): string;

    getModel(): string;

    getRelated(): typeof Model;

    query(): BuilderInterface;

    isLoaded(): boolean;

    getLoadedItems(): Model | Collection<Model> | null;

    getParent(): BaseModel;

    where(scope: Scope): BuilderInterface
    where(key: string, value: JsonValue): BuilderInterface
    where(key: string, operator: ExtendedOperator, value: JsonValue): BuilderInterface

    whereNull(key: string): BuilderInterface;

    whereNotNull(key: string): BuilderInterface;

    whereNotBetween(key: string, value: [JsonValue, JsonValue]): BuilderInterface;

    orderBy(column: string, direction?: 'asc' | 'desc'): BuilderInterface;

    searchBy(term: string): BuilderInterface;

    minified(): BuilderInterface;

    limit(value: number): BuilderInterface;



};




