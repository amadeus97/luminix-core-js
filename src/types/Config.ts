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
        [key: string]: any;
    },
    boot?: {
        data?: {
            user: { 
                id: number;
                name: string;
                email: string;
                [key: string]: any;
            } | null;
            [key: string]: any;
        };
        models?: ModelSchema;
        routes?: RouteDefinition;
    }
    [key: string]: any;
};

export type ConfigFacade = PropertyBag<AppConfiguration>;

