/**
 * `Equal<T>` is the type of a function that takes two elements of type `T` and returns if they are equal as a boolean value
 */
export type Equal<T> = (_: T) => (_: T) => boolean

/**
 * @param a one element
 * @param b another element
 * @returns true if both elements are equal using strict equality (`===`)
 */
export const strictEqual
    : <T>(_: T) => (_: T) => boolean
    = a => b => a === b
