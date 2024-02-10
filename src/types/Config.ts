import { ModelSchema } from './Model';

export type AppConfiguration = {
    app?: {
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
            }
            [key: string]: any;
        };
        models?: ModelSchema;
        routes?: { [routeName:string]: string };
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


