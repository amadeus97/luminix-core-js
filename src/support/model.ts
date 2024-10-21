import { Model } from '../types/Model';

/** @deprecated */
export function isModel(value: unknown): value is Model {
    return typeof value === 'object' 
        && value !== null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        && (value as any).__isModel === true;
}
