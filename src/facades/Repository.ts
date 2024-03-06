import { GlobalModelEvents, BaseModel, ModelSchema, ModelSchemaAttributes, Model } from '../types/Model';

import { BaseModelFactory, ModelFactory } from '../mixins/BaseModel';

import { Reduceable } from '../mixins/Reduceable';
import { AppFacade } from '../types/App';
import { HasEvents } from '../mixins/HasEvents';


class Repository {

    private _models: { [className: string]: typeof Model } = {};

    static name = 'Repository';

    constructor(
        private readonly _schema: ModelSchema,
    ) {
    }

    boot(app: AppFacade) {
        if (!this._schema) {
            return;
        }
       
        
        Object.keys(this._schema).forEach((className) => {
            if (typeof this.model !== 'function') {
                throw new Error('Expect `Repository` to be Reduceable');
            }
            // !Macro `model`
            const Model: typeof BaseModel = this.model(
                BaseModelFactory(app.make(), className),
                className
            );

            this._models[className] = ModelFactory(app.make(), className, Model);
        });
    }

    schema(): ModelSchema
    schema(className: string): ModelSchemaAttributes
    schema(className?: string) {
        if (!this._schema || (className && !this._schema[className])) {
            throw new Error(`Schema for class '${className}' not found.`);
        }

        if (className) {
            return this._schema[className];
        }

        return this._schema;

    }


    make(): { [className: string]: typeof Model}
    make(className: string): typeof Model
    make(className?: string) {
        if (className && !this._models[className]) {
            throw new Error(`Model class '${className}' not found.`);
        }

        if (!className) {
            return this._models;
        }

        return this._models[className];
    }

    toString()
    {
        return 'repository';
    }

    [macro: string]: unknown;
}


export default Reduceable(HasEvents<GlobalModelEvents, typeof Repository>(Repository));

