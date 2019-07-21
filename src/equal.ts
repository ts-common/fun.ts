export type Equal<T> = (_: T) => (_: T) => boolean

export const strictEqual
    : <T>(_: T) => (_: T) => boolean
    = a => b => a === b
