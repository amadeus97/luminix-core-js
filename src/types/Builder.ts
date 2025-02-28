import {
    EventSource, Collection, PropertyBag, Operator,
    Event, PropertyBagEventMap, JsonObject, JsonValue
} from '@luminix/support';


export type Scope<TSingle,TMany> = (builder: BuilderInterface<TSingle,TMany>) => BuilderInterface<TSingle,TMany> | void;

export type ExtendedOperator = Operator | 'like' | 'notLike' | 'between' | 'notBetween' | 'null' | 'notNull';

export type BuilderGetOptions = {
    page?: number;
    replaceLinks?: boolean;
};

export type BuilderInterface<TSingle, TMany = Collection<TSingle>> = EventSource<BuilderEventMap<TSingle,TMany>> & {
    lock(path: string): void;

    where(scope: Scope<TSingle,TMany>): BuilderInterface<TSingle,TMany>;
    where(key: string, value: JsonValue): BuilderInterface<TSingle,TMany>;
    where(key: string, operator: ExtendedOperator, value: JsonValue): BuilderInterface<TSingle,TMany>;
    where(key: string | Scope<TSingle,TMany>, operatorOrValue?: ExtendedOperator | JsonValue, value?: JsonValue): BuilderInterface<TSingle,TMany>;

    with(relation: string | string[]): BuilderInterface<TSingle,TMany>;
    withOnly(relation: string | string[]): BuilderInterface<TSingle,TMany>;
    without(relation: string | string[]): BuilderInterface<TSingle,TMany>;

    whereNull(key: string): BuilderInterface<TSingle,TMany>;
    whereNotNull(key: string): BuilderInterface<TSingle,TMany>;
    whereBetween(key: string, value: [JsonValue, JsonValue]): BuilderInterface<TSingle,TMany>;
    whereNotBetween(key: string, value: [JsonValue, JsonValue]): BuilderInterface<TSingle,TMany>;

    orderBy(column: string, direction?: 'asc' | 'desc'): BuilderInterface<TSingle,TMany>;
    searchBy(term: string): BuilderInterface<TSingle,TMany>;
    minified(): BuilderInterface<TSingle,TMany>;
    limit(value: number): BuilderInterface<TSingle,TMany>;
    include(searchParams: URLSearchParams): BuilderInterface<TSingle,TMany>;

    get(options?: BuilderGetOptions): Promise<TMany>;
    all(): Promise<Collection<TSingle>>;
    first(): Promise<TSingle | null>;
    find(id: string | number): Promise<TSingle | null>;
    unset(key: string): BuilderInterface<TSingle,TMany>;

}


export type BuilderEventMap<TSingle,TMany> = PropertyBagEventMap & {
    'change': (e: BuilderChangeEvent<TSingle,TMany>) => void,
    'submit': (e: BuilderSubmitEvent<TSingle,TMany>) => void,
    'success': (e: BuilderSuccessEvent<TSingle,TMany>) => void,
    'error': (e: BuilderErrorEvent<TSingle,TMany>) => void,
};

export type BuilderChangeEvent<TSingle,TMany> = Event<{ data: PropertyBag<JsonObject> }, BuilderInterface<TSingle,TMany>>;

export type BuilderSubmitEvent<TSingle,TMany> = Event<{ data: PropertyBag<JsonObject> }, BuilderInterface<TSingle,TMany>>;

export type BuilderErrorEvent<TSingle,TMany> = Event<{ error: unknown }, BuilderInterface<TSingle,TMany>>;

export type BuilderSuccessEvent<TSingle,TMany> = Event<
    { response: TMany, items: TSingle | Collection<TSingle> | null },
    BuilderInterface<TSingle,TMany>
>;



