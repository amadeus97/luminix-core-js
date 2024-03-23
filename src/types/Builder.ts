import PropertyBag, { PropertyBagEventMap } from '../contracts/PropertyBag';
import { Event, EventSource } from './Event';
import { JsonObject, Model, ModelPaginatedResponse } from './Model';
import { Collection } from '../contracts/Collection';

export type BuilderInterface = EventSource<BuilderEventMap> & {
    lock(path: string): void,
    where(key: string, value: unknown): BuilderInterface,
    orderBy(column: string, direction: 'asc' | 'desc'): BuilderInterface,
    searchBy(term: string): BuilderInterface,
    minified(): BuilderInterface,
    get(page: number, perPage: number, replaceLinksWith?: string): Promise<ModelPaginatedResponse>,
    all(): Promise<Collection<Model>>,
    first(): Promise<Model | null>,
    find(id: string | number): Promise<Model | null>,

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


