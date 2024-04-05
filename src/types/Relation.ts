import { BuilderInterface, ExtendedOperator, Scope } from './Builder';
import { Collection } from './Collection';
// import { BaseModel, Model } from './Model';

import { Constructor, JsonValue } from './Support';

export type {
    BuilderInterface,
    ExtendedOperator,
    Scope,
};


export type RelationInterface<T> = {

    guessInverseRelation(): string;

    set(items: T | Collection<T> | null): void;

    getForeignKey(): string | null;

    getName(): string;

    getType(): string;

    getModel(): string;

    getRelated(): Constructor<T>;

    query(): BuilderInterface;

    isLoaded(): boolean;

    getLoadedItems(): T | Collection<T> | null;

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




