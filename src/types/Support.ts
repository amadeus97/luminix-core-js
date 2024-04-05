

export type TypeOf = 'string' | 'number' | 'boolean' | 'object' | 'undefined' | 'function' | 'symbol' | 'bigint';

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
export type Constructor<T = {}> = new (...args: any[]) => T;

export type Operator = '=' | '!=' | '>' | '<' | '>=' | '<=';

export type JsonObject = {
    [key: string]: JsonValue,
}

export type JsonValue = string | number | boolean | null | JsonObject | Array<string | number | boolean | null | JsonObject>;
