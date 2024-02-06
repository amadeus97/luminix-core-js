import Config from '../containers/Config';
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

type ConfigWithNoArguments = () => Config;

type ConfigWithKey = (key: string, defaultValue?: any) => any;


export type ConfigHelper = ConfigWithNoArguments & ConfigWithKey;


