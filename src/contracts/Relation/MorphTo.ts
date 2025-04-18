import { Obj } from '@luminix/support';
import { Model } from '../../types/Model';
import BelongsTo from './BelongsTo';
import NotModelException from '../../exceptions/NotModelException';


export default class MorphTo extends BelongsTo
{
    getRelated(): typeof Model
    {
        return this.services.model.make(
            this.parent.getAttribute(this.getName() + '_type') as string
        );
    }

    // of(abstract: string): this {
    //     this.meta.model = abstract;
    //     return this;
    // }

    // query(): BuilderInterface {
    //     this.of(this.parent.getAttribute(this.getName() + '_type') as string);
    //     return super.query();
    // }
    
    async associate(item: Model): Promise<void> {
        if (!Obj.isModel(item)) {
            throw new NotModelException('MorphTo.associate()');
        }

        if (!item.exists) {
            await item.save();
        }

        return this.parent.update({
            [this.getName() + '_id']: item.getKey(),
            [this.getName() + '_type']: item.getType(),
        });
    }

    dissociate(): Promise<void> {
        return this.parent.update({
            [this.getName() + '_id']: null,
            [this.getName() + '_type']: null,
        });
    }

}

