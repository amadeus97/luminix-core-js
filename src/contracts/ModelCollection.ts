import { Collection } from '@luminix/support';

import { Model } from '../types/Model';

class ModelCollection extends Collection<Model> {

    [Symbol.toStringTag] = 'Collection';

    intersect(values: Collection<Model> | Model[]): Collection<Model> {
        return this.filter((item) => {
            return values.some((value) => value.getKey() === item.getKey());
        });
    }
}


export default ModelCollection;
