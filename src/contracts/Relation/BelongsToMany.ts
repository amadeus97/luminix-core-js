import Relation from '../Relation';
import { JsonObject, Model } from '../../types/Model';
import { isModel } from '../../mixins/BaseModel';

import { AppFacades } from '../../types/App';
import { Collection } from '../Collection';
import { BuilderInterface } from '../../types/Builder';

export default class BelongsToMany extends Relation {

    constructor(
        protected facades: AppFacades,
        protected parent: Model,
        protected related: typeof Model,
        protected items: Collection<Model> | null = null,
    ) {
        if (items !== null && !(items instanceof Collection && items.every(isModel))) {
            throw new Error('BelongsToMany expects null or Collection of models instance');
        }
        super(facades, parent, related, items);
    }

    private findInverseRelation(): string {
        const { relations } = this.related.getSchema();

        for (const relationName in relations) {
            const relation = relations[relationName];

            if (relation.model === this.parent.getType() && relation.type === 'BelongsToMany') {
                return relationName;
            }
        }

        throw new Error('BelongsToMany relation expects an inverse BelongsToMany relation');
    }

    query(): BuilderInterface {
        const query = super.query();

        query.where(this.findInverseRelation(), this.parent.getKey());

        return query;
    }

    get(page = 1, perPage = 15, replaceLinksWith?: string) {
        return this.query().get(page, perPage, replaceLinksWith);
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

    async attachWithoutFetch(id: string | number, pivot: JsonObject = {}) {
        await this.facades.route.call([
            `luminix.${this.parent.getType()}.${this.getName()}:attach`,
            {
                [this.parent.getKeyName()]: this.parent.getKey(),
                itemId: id,
            }
        ], {
            data: pivot,
        });
    }

    async attach(id: string | number, pivot: JsonObject = {}) {
        await this.attachWithoutFetch(id, pivot);

        if (this.items) {
            const currentIndex = this.items.findIndex((item) => item.getKey() === id);
            const freshItem = await this.related.find(id) as Model;
            if (currentIndex >= 0) {
                this.items.replace(currentIndex, freshItem);
            } else {
                this.items.push(freshItem);
            }
        } else {
            this.items = await this.all();
        }
    }

    async detachWithoutFetch(id: string | number) {
        await this.facades.route.call([
            `luminix.${this.parent.getType()}.${this.getName()}:detach`,
            {
                [this.parent.getKeyName()]: this.parent.getKey(),
                itemId: id,
            }
        ]);
    }

    async detach(id: string | number) {
        await this.detachWithoutFetch(id);

        if (this.items) {
            const currentIndex = this.items.findIndex((item) => item.getKey() === id);
            if (currentIndex >= 0) {
                this.items.pull(currentIndex);
            }
        }
    }

    async syncWithoutFetch(ids: (string | number | JsonObject)[]) {
        await this.facades.route.call([
            `luminix.${this.parent.getType()}.${this.getName()}:sync`,
            {
                [this.parent.getKeyName()]: this.parent.getKey(),
            }
        ], {
            data: ids,
        });
    }

    async sync(ids: (string | number | JsonObject)[]) {
        await this.syncWithoutFetch(ids);

        const newItems = await this.all();

        if (this.items) {
            this.items.flush().push(...newItems);
        } else {
            this.items = newItems;
        }

    }
}

