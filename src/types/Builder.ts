import PropertyBag, { PropertyBagEventMap } from '../contracts/PropertyBag';
import { Event, EventSource } from './Event';
import { JsonObject, JsonValue, Model, ModelPaginatedResponse } from './Model';
import { Collection } from '../contracts/Collection';
import { Operator } from './Collection';

export type Scope = (builder: BuilderInterface) => BuilderInterface | void;

export type ExtendedOperator = Operator | 'like' | 'notLike' | 'between' | 'notBetween' | 'isNull' | 'isNotNull';

export type BuilderInterface = EventSource<BuilderEventMap> & {
    lock(path: string): void;

    where(scope: Scope): BuilderInterface;
    where(key: string, value: JsonValue): BuilderInterface;
    where(key: string, operator: ExtendedOperator, value: JsonValue): BuilderInterface;
    where(key: string | Scope, operatorOrValue?: ExtendedOperator | JsonValue, value?: JsonValue): BuilderInterface;

    whereNull(key: string): BuilderInterface;
    whereNotNull(key: string): BuilderInterface;
    whereBetween(key: string, value: [JsonValue, JsonValue]): BuilderInterface;
    whereNotBetween(key: string, value: [JsonValue, JsonValue]): BuilderInterface;

    orderBy(column: string, direction?: 'asc' | 'desc'): BuilderInterface;
    searchBy(term: string): BuilderInterface;
    minified(): BuilderInterface;
    limit(value: number): BuilderInterface;

    get(page?: number, replaceLinksWith?: string): Promise<ModelPaginatedResponse>;
    all(): Promise<Collection<Model>>;
    first(): Promise<Model | null>;
    find(id: string | number): Promise<Model | null>;
    unset(key: string): BuilderInterface;

}


export type BuilderEventMap = PropertyBagEventMap & {
    'change': (e: BuilderChangeEvent) => void,
    'submit': (e: BuilderSubmitEvent) => void,
    'success': (e: BuilderSuccessEvent) => void,
    'error': (e: BuilderErrorEvent) => void,
};

export type BuilderChangeEvent = Event<BuilderInterface> & {
    data: PropertyBag<JsonObject>,
};

export type BuilderSubmitEvent = Event<BuilderInterface> & {
    data: PropertyBag<JsonObject>,
};

export type BuilderSuccessEvent = Event<BuilderInterface> & {
    response: ModelPaginatedResponse,
    items: Collection<Model> | Model | null,
};

export type BuilderErrorEvent = Event<BuilderInterface> & {
    error: unknown,
};


