

/** @deprecated */
// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
export type Constructor<T = {}> = new (...args: any[]) => T;


/** @deprecated */
export type JsonObject = {
    [key: string]: JsonValue,
}

/** @deprecated */
export type JsonValue = string | number | boolean | null | JsonObject | Array<string | number | boolean | null | JsonObject>;
