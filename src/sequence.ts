import * as meta from './meta'

export type Sequence<T> = {
    readonly value: T
    readonly next: () => Sequence<T> | undefined
}

export const fromArray
    : <T>(_: readonly T[]) => Sequence<T> | undefined
    = array => {
        type T = meta.ArrayItem<typeof array>
        const next
            : (_: number) => Sequence<T> | undefined
            = i => i < array.length ? ({ value: array[i], next: () => next(i + 1) }) : undefined
        return next(0)
    }

export type Reduce<A, T> = (_: A) => (_: T) => A

export const fold
    : <A, T>(_: Reduce<A, T>) => (_: A) => (_: Sequence<T> | undefined) => A
    = reduce => {
        type A = typeof reduce extends Reduce<infer RA, infer _> ? RA : never
        type T = typeof reduce extends Reduce<infer _, infer RT> ? RT : never
        const f
            : (_: A) => (_: Sequence<T> | undefined) => A
            = accumulator => sequence => sequence === undefined ?
                accumulator :
                f(reduce(accumulator)(sequence.value))(sequence.next())
        return f
    }

const push
    : <T>(_: readonly T[]) => (_: T) => readonly T[]
    = a => v => [...a, v]

export const toArray
    : <T>(_: Sequence<T> | undefined) => readonly T[]
    = sequence => {
        type T = typeof sequence extends Sequence<infer RT> | undefined ? RT : never
        return fold(push)<T>([])(sequence)
    }
