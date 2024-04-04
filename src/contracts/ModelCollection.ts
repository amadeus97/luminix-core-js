import { Collection, isCollection } from './ComposedCollection';

import { Model } from '../types/Model';
import { HasEvents } from '..';
import { CollectionEvents } from '../types/Collection';


class ModelCollection extends Collection<Model> {

    static name = 'Collection';

    intersect(values: Collection<Model> | Model[]): Collection<Model> {
        return new ModelCollection(this.items.filter((item) => {
            return isCollection(values)
                ? values.contains((value) => value.getKey() === item.getKey())
                : values.some((value) => value.getKey() === item.getKey());
        }));
    }
}


export default HasEvents<CollectionEvents<Model>, typeof ModelCollection>(ModelCollection);
