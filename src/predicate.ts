/**
 * `Predicate<T>` is the type of a function that takes any type `T` and returns a boolean value
 */
export type Predicate<T> = (_: T) => boolean
