import { ModelSchema } from './Model';
import { RouteDefinition } from './Route';

export type AppConfiguration = {
    app?: {
        env?: string;
        debug?: boolean;
        bootUrl?: string;
        enforceCamelCaseForModelAttributes?: boolean;
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

export type ConfigFacade = {
    get(path: string, defaultValue?: any): any;
    set(path: string, value: any): void;
    merge(path: string, value: any): void;
    has(path: string): boolean;
    lock(path: string): void;
    all(): AppConfiguration;
    delete(path: string): void;

};

type ConfigWithNoArguments = () => ConfigFacade;

type ConfigWithKey = (path: string, defaultValue?: any) => any;


export type ConfigHelper = ConfigWithNoArguments & ConfigWithKey;


