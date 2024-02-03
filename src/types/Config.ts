import Config from '../containers/Config';

type ConfigWithNoArguments = () => Config;

type ConfigWithKey = (key: string, defaultValue?: any) => any;


export type ConfigHelper = ConfigWithNoArguments & ConfigWithKey;


