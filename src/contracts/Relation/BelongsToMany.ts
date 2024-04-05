import Relation from '../Relation';
import { Model, ModelPaginatedResponse, RelationMetaData } from '../../types/Model';
import { isModel } from '../../support/model';

import { AppFacades } from '../../types/App';
import Collection from '../Collection';
import { BuilderInterface as Builder } from '../../types/Builder';
import NotModelException from '../../exceptions/NotModelException';

import { Collection as CollectionInterface } from '../../types/Collection';
import { JsonObject } from '../../types/Support';

type BuilderInterface = Builder<Model, ModelPaginatedResponse>;

export default class BelongsToMany extends Relation {

    constructor(
        protected meta: RelationMetaData,
        protected facades: AppFacades,
        protected parent: Model,
        protected items: CollectionInterface<Model> | null = null,
    ) {
        if (items !== null && !(items instanceof Collection && items.every(isModel))) {
            throw new NotModelException('BelongsToMany.constructor()', 'Collection<Model> or null');
        }
        super(meta, facades, parent, items);
    }

    query(): BuilderInterface {
        const query = super.query();

        const relation = this.guessInverseRelation();

        query.where(relation, this.parent.getKey());
        query.lock(`filters.${relation}`);

        return query;
    }

    get(page = 1, replaceLinksWith?: string) {
        return this.query().get(page, replaceLinksWith);
    }

    all() {
        return this.query().all();
    }

    first() {
        return this.query().first();
    }

    find(id: string | number) {
        return this.query().find(id);
    }

    attachQuietly(id: string | number, pivot: JsonObject = {}) {
        return this.facades.route.call([
            `luminix.${this.parent.getType()}.${this.getName()}:attach`,
            {
                [this.parent.getKeyName()]: this.parent.getKey(),
                itemId: id,
            }
        ], {
            data: pivot,
            errorBag: `${this.parent.getType()}[${this.parent.getKey()}].${this.getName()}:attach`
        });
    }

    async attach(id: string | number, pivot: JsonObject = {}) {
        await this.attachQuietly(id, pivot);

        if (this.items) {
            const currentIndex = this.items.search((item) => item.getKey() === id);
            const freshItem = await this.getRelated().find(id);

            if (!freshItem) {
                return;
            }

            if (false !== currentIndex) {
                this.items.put(currentIndex, freshItem);
            } else {
                this.items.push(freshItem);
            }
        } else {
            this.items = await this.all();
        }
    }

    async detachQuietly(id: string | number) {
        await this.facades.route.call(
            [
                `luminix.${this.parent.getType()}.${this.getName()}:detach`,
                {
                    [this.parent.getKeyName()]: this.parent.getKey(),
                    itemId: id,
                }
            ],
            {
                errorBag: `${this.parent.getType()}[${this.parent.getKey()}].${this.getName()}:detach`
            }
        );
    }

    async detach(id: string | number) {
        await this.detachQuietly(id);

        if (this.items) {
            const currentIndex = this.items.search((item) => item.getKey() === id);
            if (false !== currentIndex) {
                this.items.pull(currentIndex);
            }
        }
    }

    async syncQuietly(ids: (string | number | JsonObject)[]) {
        await this.facades.route.call([
            `luminix.${this.parent.getType()}.${this.getName()}:sync`,
            {
                [this.parent.getKeyName()]: this.parent.getKey(),
            }
        ], {
            data: ids,
            errorBag: `${this.parent.getType()}[${this.parent.getKey()}].${this.getName()}:sync`
        });
    }

    async syncWithPivotValuesQuietly(ids: (string | number)[], pivot: JsonObject) {
        await this.facades.route.call([
            `luminix.${this.parent.getType()}.${this.getName()}:sync`,
            {
                [this.parent.getKeyName()]: this.parent.getKey(),
            }
        ], {
            data: ids.map((id) => ({
                [this.getRelated().getSchema().primaryKey]: id,
                ...pivot,
            })),
            errorBag: `${this.parent.getType()}[${this.parent.getKey()}].${this.getName()}:sync`
        });
    }

    async sync(ids: (string | number | JsonObject)[]) {
        await this.syncQuietly(ids);

        const newItems = await this.all();

        if (this.items) {
            this.items.splice(0, this.items.count(), ...newItems);
        } else {
            this.items = newItems;
        }

    }

    async syncWithPivotValues(ids: (string | number)[], pivot: JsonObject) {
        await this.syncWithPivotValuesQuietly(ids, pivot);

        const newItems = await this.all();

        if (this.items) {
            this.items.splice(0, this.items.count(), ...newItems);
        } else {
            this.items = newItems;
        }
    }
}

