import { Collection } from './Collection';

import { Model } from '../types/Model';
// import { HasEvents } from '..';
import { Collection as CollectionInterface } from '../types/Collection';


class ModelCollection extends Collection<Model> {

    static name = 'Collection';

    intersect(values: Collection<Model> | Model[]): CollectionInterface<Model> {
        return new ModelCollection(this.items.filter((item) => {
            return !Array.isArray(values)
                ? values.contains((value) => value.getKey() === item.getKey())
                : values.some((value) => value.getKey() === item.getKey());
        }));
    }
}


export default ModelCollection;
