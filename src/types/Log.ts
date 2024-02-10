

export type LogFacade = {
    emergency(...args: any[]): void;
    alert(...args: any[]): void;
    critical(...args: any[]): void;
    error(...args: any[]): void;
    warning(...args: any[]): void;
    notice(...args: any[]): void;
    info(...args: any[]): void;
    debug(...args: any[]): void;
    log(...args: any[]): void;
};

type LogHelperWithNoArguments = () => LogFacade;
type LogHelperWithArguments = (...args: any[]) => void;

export type LogHelper = LogHelperWithNoArguments & LogHelperWithArguments;

