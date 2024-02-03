import App from "../containers/App";
import Config from "../containers/Config";
import Macro from "../containers/Macro";
import { ModelSchema } from "../types/Model";

import makeCastAttributeFilter from "./makeCastAttributeFilter";

export default (app: App) => {

    const macro = app.getContainer('macro') as Macro;
    const config = app.getContainer('config') as Config;


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
