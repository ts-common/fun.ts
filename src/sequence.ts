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

export const scan
    : <A, T>(_: Reduce<A, T>) => (_: A) => (_: Sequence<T> | undefined) => Sequence<A>
    = reduce => {
        type A = typeof reduce extends Reduce<infer RA, infer _> ? RA : never
        type T = typeof reduce extends Reduce<infer _, infer RT> ? RT : never
        const f
            : (_: A) => (_: Sequence<T> | undefined) => Sequence<A>
            = value => sequence => ({
                value,
                next: () => sequence === undefined ? undefined : f(reduce(value)(sequence.value))(sequence.next())
            })
        return f
    }

export const last
    : <T>(_: Sequence<T>) => T
    = sequence => {
        const next = sequence.next()
        // Hopefully, last() is PTC (proper tail call).
        // Link: https://webkit.org/blog/6240/ecmascript-6-proper-tail-calls-in-webkit/
        return next === undefined ? sequence.value : last(next)
    }

export const fold
    : <A, T>(_: Reduce<A, T>) => (_: A) => (_: Sequence<T> | undefined) => A
    = reduce => accumulator => sequence => last(scan(reduce)(accumulator)(sequence))

const push
    : <T>(_: readonly T[]) => (_: T) => readonly T[]
    = a => v => [...a, v]

export type OptionalSequence<T> = Sequence<T> | undefined

export const toArray
    : <T>(_: Sequence<T> | undefined) => readonly T[]
    = sequence => fold
        (push)
        <typeof sequence extends Sequence<infer I> | undefined ? I : never>([])
        (sequence)

type ReverseTail<T> = {
    readonly sequence?: Sequence<T>
    readonly tail?: Sequence<T>
}

const reverseTail
    : <T>(_: ReverseTail<T>) => Sequence<T> | undefined
    = ({ sequence, tail }) => sequence === undefined
        ? tail
        // Tail recursion
        : reverseTail({ sequence: sequence.next(), tail: { value: sequence.value, next: () => tail } })

export const reverse
    : <T>(_: Sequence<T> | undefined) => Sequence<T> | undefined
    = sequence => reverseTail({ sequence })

const concatBefore
    : <T>(_: Sequence<T> | undefined) => (_: Sequence<T> | undefined) => Sequence<T> | undefined
    = b => {
        const f
            : (_: typeof b) => typeof b
            = a => a === undefined ? b : { value: a.value, next: () => f(a.next()) }
        return f
    }

export const concat
    : <T>(_: Sequence<T> | undefined) => (_: Sequence<T> | undefined) => Sequence<T> | undefined
    = a => b => concatBefore(b)(a)
