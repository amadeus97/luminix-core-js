import { Collection } from '../contracts/Collection';
import { Event } from './Event';

export type CollectionEvents = {
    'change': (e: Event<Collection>) => void,
}

export type Operator = '=' | '!=' | '>' | '>=' | '<' | '<=';

// export type Collection<T = unknown> = EventSource<CollectionEvents> & CollectionClass<T>;



