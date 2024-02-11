
/**
 * A facade for logging messages. Provides eight logging levels, defined in the RFC 5424 standard.
 */
export type LogFacade = {

    /**
     * System is unusable. (Code: 0)
     */
    emergency(...args: any[]): void;

    /**
     * Action must be taken immediately. (Code: 1)
     */
    alert(...args: any[]): void;

    /**
     * Critical conditions. (Code: 2)
     */
    critical(...args: any[]): void;

    /**
     * Error conditions. (Code: 3)
     */
    error(...args: any[]): void;

    /**
     * Warning conditions. (Code: 4)
     */
    warning(...args: any[]): void;

    /**
     * Normal but significant condition. (Code: 5)
     */
    notice(...args: any[]): void;

    /**
     * Informational messages. (Code: 6)
     */
    info(...args: any[]): void;

    /**
     * Debug-level messages. (Code: 7)
     */
    debug(...args: any[]): void;
};

type LogHelperWithNoArguments = () => LogFacade;
type LogHelperWithArguments = (...args: any[]) => void;

export type LogHelper = LogHelperWithNoArguments & LogHelperWithArguments;

