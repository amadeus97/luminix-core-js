
import { AppContainers } from "../types/App";
import { ModelSchema } from "../types/Model";

import makeCastAttributeFilter from "./makeCastAttributeFilter";

export default ({ macro, config }: AppContainers) => {

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
