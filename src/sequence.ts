import * as meta from './meta'
import * as equal from './equal'

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

export type NextState<T, R> = (_: T) => State<T, R>

export type State<T, R> = {
    readonly value: R
    readonly next: NextState<T, R>
}

export const accumulator
    : <T, R>(_: Reduce<T, R>) => (_: R) => State<T, R>
    = reduce => {
        type TR = typeof reduce extends Reduce<infer T0, infer R0> ? readonly [T0, R0] : never
        type T = TR[0]
        type R = TR[1]
        const f
            : (_: R) => State<T, R>
            = value => ({
                value,
                next: v => f(reduce(value)(v))
            })
        return f
    }

export const inclusiveScan
    : <T, R>(_: NextState<T, R>) => (_: Sequence<T> | undefined) => Sequence<R> | undefined
    = next => sequence => sequence === undefined ? undefined : exclusiveScan(next(sequence.value))(sequence.next())

export const exclusiveScan
    : <T, R>(_: State<T, R>) => (_: Sequence<T> | undefined) => Sequence<R>
    = ({ value, next }) => sequence => ({
        value,
        next: () => inclusiveScan(next)(sequence)
    })

export type FilterState<T> = State<T, boolean>

export type NextFilterState<T> = NextState<T, boolean>

export const scanFilter
    : <T>(_: NextFilterState<T>) => (_: Sequence<T> | undefined) => Sequence<T> | undefined
    = nextFilterState => sequence => {
        if (sequence === undefined) {
            return undefined
        }
        const { value } = sequence
        const state = nextFilterState(value)
        const next = () => scanFilter(state.next)(sequence.next())
        return state.value ? { value, next } : next()
    }

export const dedupNextState
    : <T>(_: equal.Equal<T>) => NextFilterState<T>
    = e => {
        type T = typeof e extends equal.Equal<infer _T> ? _T : never
        const create
            : (_: boolean) => (_: T) => FilterState<T>
            = value => current => ({
                value,
                next: next(current)
            })
        const next
            : (_: T) => (_: T) => FilterState<T>
            = prior => current => create(!e(prior)(current))(current)
        return create(true)
    }

export const dedup
    : <T>(_: equal.Equal<T>) => (_: Sequence<T> | undefined) => Sequence<T> | undefined
    = e => scanFilter(dedupNextState(e))

export const flatten
    : <T>(_: Sequence<Sequence<T> | undefined> | undefined) => Sequence<T> | undefined
    = sequence => {
        if (sequence === undefined) {
            return undefined
        }
        const { value, next } = sequence
        return concatFront(() => flatten(next()))(value)
    }

export const infinite
    : Sequence<undefined>
    = ({
        value: undefined,
        next: () => infinite
    })

export const take
    : (_: number) => <T>(_: Sequence<T> | undefined) => Sequence<T> | undefined
    = n => sequence => n <= 0 || sequence === undefined
        ? undefined :
        ({ value: sequence.value, next: () => take(n - 1)(sequence.next()) })

export type Entry<T> = readonly [number, T]

const nextEntryState
    : (_: number) => <T>(_: T) => State<T, Entry<T>>
    = i => v => ({
        value: [i, v],
        next: nextEntryState(i + 1)
    })

export const entries
    : <T>(_: Sequence<T> | undefined) => Sequence<Entry<T>> | undefined
    = inclusiveScan(nextEntryState(0))

export const map
    : <T, R>(_: (_: T) => R) => (_: Sequence<T> | undefined) => Sequence<R> | undefined
    = f => {
        type TR = typeof f extends (_: infer T0) => infer R0 ? readonly [T0, R0] : never
        type T = TR[0]
        type R = TR[1]
        const r
            : (_: Sequence<T> | undefined) => Sequence<R> | undefined
            = sequence => sequence === undefined ? undefined : ({
                value: f(sequence.value),
                next: () => r(sequence.next())
            })
        return r
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
    : <T, R>(_: State<T, R>) => (_: Sequence<T> | undefined) => R
    = state => sequence => last(exclusiveScan(state)(sequence))

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

const concatFront
    : <T>(_: () => Sequence<T> | undefined) => (_: Sequence<T> | undefined) => Sequence<T> | undefined
    = b => {
        type S = typeof b extends () => (infer U) ? U : never
        const f
            : (_: S) => S
            = a => a === undefined ? b() : { value: a.value, next: () => f(a.next()) }
        return f
    }

export const concat
    : <T>(_: Sequence<T> | undefined) => (_: Sequence<T> | undefined) => Sequence<T> | undefined
    = a => b => concatFront(() => b)(a)
