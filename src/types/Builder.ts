import PropertyBag, { PropertyBagEventMap } from '../contracts/PropertyBag';
import { Event, EventSource } from './Event';

import { JsonObject, JsonValue } from './Support';

import { Operator, Collection } from './Collection';

export type Scope<R,C> = (builder: BuilderInterface<R,C>) => BuilderInterface<R,C> | void;

export type ExtendedOperator = Operator | 'like' | 'notLike' | 'between' | 'notBetween' | 'isNull' | 'isNotNull';

export type BuilderInterface<R, C> = EventSource<BuilderEventMap<R,C>> & {
    lock(path: string): void;

    where(scope: Scope<R,C>): BuilderInterface<R,C>;
    where(key: string, value: JsonValue): BuilderInterface<R,C>;
    where(key: string, operator: ExtendedOperator, value: JsonValue): BuilderInterface<R,C>;
    where(key: string | Scope<R,C>, operatorOrValue?: ExtendedOperator | JsonValue, value?: JsonValue): BuilderInterface<R,C>;

    whereNull(key: string): BuilderInterface<R,C>;
    whereNotNull(key: string): BuilderInterface<R,C>;
    whereBetween(key: string, value: [JsonValue, JsonValue]): BuilderInterface<R,C>;
    whereNotBetween(key: string, value: [JsonValue, JsonValue]): BuilderInterface<R,C>;

    orderBy(column: string, direction?: 'asc' | 'desc'): BuilderInterface<R,C>;
    searchBy(term: string): BuilderInterface<R,C>;
    minified(): BuilderInterface<R,C>;
    limit(value: number): BuilderInterface<R,C>;

    get(page?: number, replaceLinksWith?: string): Promise<C>;
    all(): Promise<Collection<R>>;
    first(): Promise<R | null>;
    find(id: string | number): Promise<R | null>;
    unset(key: string): BuilderInterface<R,C>;

}


export type BuilderEventMap<R,C> = PropertyBagEventMap & {
    'change': (e: BuilderChangeEvent<R,C>) => void,
    'submit': (e: BuilderSubmitEvent<R,C>) => void,
    'success': (e: BuilderSuccessEvent<R,C>) => void,
    'error': (e: BuilderErrorEvent<R,C>) => void,
};

export type BuilderChangeEvent<R,C> = Event<BuilderInterface<R,C>> & {
    data: PropertyBag<JsonObject>,
};

export type BuilderSubmitEvent<R,C> = Event<BuilderInterface<R,C>> & {
    data: PropertyBag<JsonObject>,
};

export type BuilderSuccessEvent<R,C> = Event<BuilderInterface<R,C>> & {
    response: C,
    items: Collection<R> | R | null,
};

export type BuilderErrorEvent<R,C> = Event<BuilderInterface<R,C>> & {
    error: unknown,
};


