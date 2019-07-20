export type Sign = -1 | 0 | 1

export type Compare<E> = (_: E) => (_: E) => Sign

export const numberCompare
    : (_: number) => (_: number) => Sign
    = a => b => a === b ? 0 : a < b ? -1 : 1
