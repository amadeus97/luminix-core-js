
import { AppFacades } from "../types/App";
import { ModelSchema } from "../types/Model";

const makeCastAttributeFilter = (cast: string) => (original: any) => {
    if (original === null || original === undefined) {
        return original;
    }
    
    if (cast === 'boolean') {
        return !!original;
    }
    if (['date', 'datetime', 'immutable_date', 'immutable_datetime'].includes(cast)) {
        return new Date(original);
    }
    if (
        ['float', 'double', 'integer'].includes(cast)
        || cast.startsWith('decimal:')
    ) {
        return Number(original);
    }

    return original;
};

export default ({ macro, config }: AppFacades) => {

    const modelSchema: ModelSchema = config.get('boot.models');

    const models = Object.keys(modelSchema);

    // the registration for each model
    models.forEach((model) => {
        const schema = modelSchema[model];

        // adding casts
        const { casts = {} } = schema;
        Object.entries(casts).forEach(([field, cast]) => {
            macro.addFilter(
                `model_${model}_get_${field}_attribute`,
                makeCastAttributeFilter(cast),
                5
            );
        });

    });

};
