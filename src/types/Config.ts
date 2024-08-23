import { PropertyBag } from './PropertyBag';
import { ModelSchema } from './Model';
import { RouteDefinition } from './Route';

export type AppConfiguration = {
    app?: {
        name?: string;
        env?: string;
        debug?: boolean;
        url?: string;
        port?: string | number;
        bootUrl?: string | null | false;

        /** @deprecated */
        enforceCamelCaseForModelAttributes?: boolean

        [key: string]: unknown;
    },
    auth?: {
        user: { 
            id: number;
            name: string;
            email: string;
            [key: string]: unknown;
        } | null;
        csrf?: string;
    },
    manifest?: {
        models?: ModelSchema;
        routes?: RouteDefinition;
    },
    [key: string]: unknown;
};

export type ConfigFacade = PropertyBag<AppConfiguration>;

