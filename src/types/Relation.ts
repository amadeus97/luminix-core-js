import { Collection } from '@luminix/support';
import { BuilderInterface, ExtendedOperator, Scope } from './Builder';
// import { BaseModel, Model } from './Model';

import { Constructor, JsonValue } from './Support';

export type {
    BuilderInterface,
    ExtendedOperator,
    Scope,
};


export type RelationInterface<R,C> = {

    guessInverseRelation(): string;

    make(data: JsonValue): void;

    set(items: R | Collection<R> | null): void;

    getForeignKey(): string | null;

    getName(): string;

    getType(): string;

    getModel(): string;

    getRelated(): Constructor<R>;

    isSingle(): boolean;

    isMultiple(): boolean;

    query(): BuilderInterface<R,C>;

    isLoaded(): boolean;

    getLoadedItems(): R | Collection<R> | null;

    where(scope: Scope<R,C>): BuilderInterface<R,C>
    where(key: string, value: JsonValue): BuilderInterface<R,C>
    where(key: string, operator: ExtendedOperator, value: JsonValue): BuilderInterface<R,C>

    whereNull(key: string): BuilderInterface<R,C>;

    whereNotNull(key: string): BuilderInterface<R,C>;

    whereNotBetween(key: string, value: [JsonValue, JsonValue]): BuilderInterface<R,C>;

    orderBy(column: string, direction?: 'asc' | 'desc'): BuilderInterface<R,C>;

    searchBy(term: string): BuilderInterface<R,C>;

    minified(): BuilderInterface<R,C>;

    limit(value: number): BuilderInterface<R,C>;



};




