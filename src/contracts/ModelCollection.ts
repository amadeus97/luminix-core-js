import { Collection } from './Collection';

import { Model } from '../types/Model';
// import { HasEvents } from '..';
import { Collection as CollectionInterface } from '../types/Collection';


class ModelCollection extends Collection<Model> {

    [Symbol.toStringTag] = 'Collection';

    intersect(values: Collection<Model> | Model[]): CollectionInterface<Model> {
        return this.filter((item) => {
            return values.some((value) => value.getKey() === item.getKey());
        });
    }
}


export default ModelCollection;
