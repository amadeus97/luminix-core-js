import { PropertyBag } from '..';
import { ModelSchema } from './Model';
import { RouteDefinition } from './Route';

export type AppConfiguration = {
    app?: {
        env?: string;
        debug?: boolean;
        bootUrl?: string | null | false;
        enforceCamelCaseForModelAttributes?: boolean;
        csrfToken?: string;
        [key: string]: unknown;
    },
    boot?: {
        data?: {
            user: { 
                id: number;
                name: string;
                email: string;
                [key: string]: unknown;
            } | null;
            [key: string]: unknown;
        };
        models?: ModelSchema;
        routes?: RouteDefinition;
    }
    [key: string]: unknown;
};

export type ConfigFacade = PropertyBag<AppConfiguration>;

