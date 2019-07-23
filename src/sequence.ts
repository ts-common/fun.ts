import * as meta from './meta'
import * as equal from './equal'
import * as optional from './optional'
import * as predicate from './predicate'

export type NonEmptySequence<T> = {
    readonly first: T
    readonly rest: () => Sequence<T>
}

export type Sequence<T> = NonEmptySequence<T> | undefined

export const fromArray
    : <T>(_: readonly T[]) => Sequence<T>
    = array => {
        type T = meta.ArrayItem<typeof array>
        const next
            : (_: number) => Sequence<T>
            = i => i < array.length ? ({ first: array[i], rest: () => next(i + 1) }) : undefined
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
    : <T, R>(_: NextState<T, R>) => (_: Sequence<T>) => Sequence<R>
    = nextState => optional.map(({ first, rest }) => exclusiveScan(nextState(first))(rest()))

export const exclusiveScan
    : <T, R>(_: State<T, R>) => (_: Sequence<T>) => NonEmptySequence<R>
    = ({ value, next }) => sequence => ({
        first: value,
        rest: () => inclusiveScan(next)(sequence)
    })

export type FilterState<T> = State<T, boolean>

export type NextFilterState<T> = NextState<T, boolean>

export const scanFilter
    : <T>(_: NextFilterState<T>) => (_: Sequence<T>) => Sequence<T>
    = nextFilterState => optional.map(({ first, rest }) => {
        const state = nextFilterState(first)
        const nextState = () => scanFilter(state.next)(rest())
        return state.value ? { first, rest: nextState } : nextState()
    })

/**
 * Return a Sequence<T> with initial elements matching the predicate removed
 */
export const dropWhile
    : <T>(_: predicate.Predicate<T>) => (_: Sequence<T>) => Sequence<T>
    = p => {
        type T = typeof p extends predicate.Predicate<infer _T> ? _T : never
        const result
            : (_: Sequence<T>) => Sequence<T>
            = optional.map(({ first, rest }) => {
                const dropNext = () => result(rest())
                return p(first) ? dropNext() : { first, rest }
            })
        return result
    }

export const filter
    : <T>(_: predicate.Predicate<T>) => (_: Sequence<T>) => Sequence<T>
    = p => {
        type T = typeof p extends predicate.Predicate<infer _T> ? _T : never
        const result
            : (_: Sequence<T>) => Sequence<T>
            = optional.map(({ first, rest }) => {
                const filterNext = () => result(rest())
                return p(first) ? { first, rest: filterNext } : filterNext()
            })
        return result
    }

const dedupNextState
    : <T>(_: equal.Equal<T>) => NextFilterState<T>
    = e => {
        type T = typeof e extends equal.Equal<infer _T> ? _T : never
        const createState
            : (_: boolean) => (_: T) => FilterState<T>
            = value => current => ({
                value,
                next: nextState(current)
            })
        const nextState
            : (_: T) => (_: T) => FilterState<T>
            = prior => current => createState(!e(prior)(current))(current)
        return createState(true)
    }

export const dedup
    : <T>(_: equal.Equal<T>) => (_: Sequence<T>) => Sequence<T>
    = e => scanFilter(dedupNextState(e))

export const flatten
    : <T>(_: Sequence<Sequence<T>>) => Sequence<T>
    = optional.map(({ first, rest }) => concatFront(() => flatten(rest()))(first))

export const infinite
    : NonEmptySequence<undefined>
    = ({
        first: undefined,
        rest: () => infinite
    })

export const take
    : (_: number) => <T>(_: Sequence<T>) => Sequence<T>
    = n => optional.map(({ first, rest }) => n <= 0 ? undefined : ({ first, rest: () => take(n - 1)(rest()) }))

export type Entry<T> = readonly [number, T]

const nextEntryState
    : (_: number) => <T>(_: T) => State<T, Entry<T>>
    = i => v => ({
        value: [i, v],
        next: nextEntryState(i + 1)
    })

export const entries
    : <T>(_: Sequence<T>) => Sequence<Entry<T>>
    = inclusiveScan(nextEntryState(0))

export const map
    : <T, R>(_: (_: T) => R) => (_: Sequence<T>) => Sequence<R>
    = f => {
        type TR = typeof f extends (_: infer T0) => infer R0 ? readonly [T0, R0] : never
        type T = TR[0]
        type R = TR[1]
        const result
            : (_: Sequence<T>) => Sequence<R>
            = optional.map(({ first, rest }) => ({
                first: f(first),
                rest: () => result(rest())
            }))
        return result
    }

export const last
    : <T>(_: NonEmptySequence<T>) => T
    = ({ first, rest }) => {
        const nextSequence = rest()
        // Hopefully, last() is PTC (proper tail call).
        // Link: https://webkit.org/blog/6240/ecmascript-6-proper-tail-calls-in-webkit/
        return nextSequence === undefined ? first : last(nextSequence)
    }

export const exclusiveFold
    : <T, R>(_: State<T, R>) => (_: Sequence<T>) => R
    = state => sequence => last(exclusiveScan(state)(sequence))

const push
    : <T>(_: readonly T[]) => (_: T) => readonly T[]
    = a => v => [...a, v]

export const toArray
    : <T>(_: Sequence<T>) => readonly T[]
    = sequence => exclusiveFold
        (accumulator(push)<typeof sequence extends Sequence<infer I> ? I : never>([]))
        (sequence)

type ReverseTail<T> = {
    readonly sequence: Sequence<T>
    readonly tail: Sequence<T>
}

const reverseTail
    : <T>(_: ReverseTail<T>) => Sequence<T>
    = ({ sequence, tail }) => sequence === undefined
        ? tail
        // Tail recursion
        : reverseTail({ sequence: sequence.rest(), tail: { first: sequence.first, rest: () => tail } })

export const reverse
    : <T>(_: Sequence<T>) => Sequence<T>
    = sequence => reverseTail({ sequence, tail: undefined })

const concatFront
    : <T>(_: () => Sequence<T>) => (_: Sequence<T>) => Sequence<T>
    = b => {
        type S = typeof b extends () => (infer U) ? U : never
        const f
            : (_: S) => S
            = a => a === undefined ? b() : { first: a.first, rest: () => f(a.rest()) }
        return f
    }

export const concat
    : <T>(_: Sequence<T>) => (_: Sequence<T>) => Sequence<T>
    = a => b => concatFront(() => b)(a)

type SizeState<T> = {
    readonly value: number
    readonly rest: Sequence<T>
}

const foldSizeState
    : <T>(_: SizeState<T>) => number
    = ({ value, rest }) => rest === undefined ? value : foldSizeState({ value: value + 1, rest: rest.rest() })

export const size
    : <T>(_: Sequence<T>) => number
    = rest => foldSizeState({ value: 0, rest })
