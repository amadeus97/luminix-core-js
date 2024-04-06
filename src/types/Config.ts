import { PropertyBag } from '..';
import { ModelSchema } from './Model';
import { RouteDefinition } from './Route';

export type AppConfiguration = {
    app?: {
        env?: string;
        debug?: boolean;
        url?: string;
        bootUrl?: string | null | false;
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

