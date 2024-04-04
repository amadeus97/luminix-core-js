

export function cartesian<T>(...arrays: T[][]): T[][] {
    return arrays.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())) as T[]) as T[][];
}
