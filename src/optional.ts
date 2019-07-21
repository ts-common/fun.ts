export type Optional<T> = T | undefined

export const map
    : <T, R>(_: (_: T) => R) => (_: Optional<T>) => Optional<R>
    = f => optional => optional === undefined ? undefined : f(optional)
