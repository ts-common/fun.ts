/**
 * Optional is either a value of a type `T` or `undefined`
 */
export type Optional<T> = T | undefined

/**
 * @param f a function from a type T to a type R
 * @param optional an `Optional` value of type `T` or `undefined`
 * @returns the result of applying f to `optional` if it's defined, otherwise undefined.
 */
export const map
    : <T, R>(_: (_: T) => R) => (_: Optional<T>) => Optional<R>
    = f => optional => optional === undefined ? undefined : f(optional)
