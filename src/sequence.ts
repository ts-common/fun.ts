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

export type Reduce<T, R> = (_: R) => (_: T) => R

export type ScanState<T, R> = {
    readonly value: R
    readonly next: (v: T) => ScanState<T, R>
}

export const accumulator
    : <T, R>(_: Reduce<T, R>) => (_: R) => ScanState<T, R>
    = reduce => {
        type TR = typeof reduce extends Reduce<infer T0, infer R0> ? readonly [T0, R0] : never
        type T = TR[0]
        type R = TR[1]
        const f
            : (_: R) => ScanState<T, R>
            = value => ({
                value,
                next: v => f(reduce(value)(v))
            })
        return f
    }

export const scan
    : <T, R>(_: ScanState<T, R>) => (_: Sequence<T> | undefined) => Sequence<R>
    = ({ value, next }) => sequence => ({
        value,
        next: () => sequence === undefined ? undefined : scan(next(sequence.value))(sequence.next())
    })

export const last
    : <T>(_: Sequence<T>) => T
    = sequence => {
        const next = sequence.next()
        // Hopefully, last() is PTC (proper tail call).
        // Link: https://webkit.org/blog/6240/ecmascript-6-proper-tail-calls-in-webkit/
        return next === undefined ? sequence.value : last(next)
    }

export const fold
    : <T, R>(_: ScanState<T, R>) => (_: Sequence<T> | undefined) => R
    = state => sequence => last(scan(state)(sequence))

const push
    : <T>(_: readonly T[]) => (_: T) => readonly T[]
    = a => v => [...a, v]

export type OptionalSequence<T> = Sequence<T> | undefined

export const toArray
    : <T>(_: Sequence<T> | undefined) => readonly T[]
    = sequence => fold
        (accumulator(push)<typeof sequence extends Sequence<infer I> | undefined ? I : never>([]))
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

export const concatBefore
    : <T>(_: Sequence<T> | undefined) => (_: Sequence<T> | undefined) => Sequence<T> | undefined
    = b => {
        type S = typeof b
        const f
            : (_: S) => S
            = a => a === undefined ? b : { value: a.value, next: () => f(a.next()) }
        return f
    }

export const concat
    : <T>(_: Sequence<T> | undefined) => (_: Sequence<T> | undefined) => Sequence<T> | undefined
    = a => b => concatBefore(b)(a)
