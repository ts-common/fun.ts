/**
 * `Sign` encodes the result of comparing two elements:
 * `-1` for *less than*, `0` for *equal* and `1` for *greater than*
 */
export type Sign = -1 | 0 | 1

/**
 * A type for functions that two elements of type `E` and return the `Sign` of comparing them
 */
export type Compare<E> = (_: E) => (_: E) => Sign

/**
 * @param a a number
 * @param b another number
 * @returns returns a `Sign` value after comparing the numbers `a` and `b`
 */
export const numberCompare
    : (_: number) => (_: number) => Sign
    = a => b => a === b ? 0 : a < b ? -1 : 1
