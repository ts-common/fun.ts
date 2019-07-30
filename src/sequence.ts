import * as meta from './meta'
import * as equal from './equal'
import * as optional from './optional'
import * as predicate from './predicate'

export type LazySequence<T> = () => Sequence<T>

export type NonEmptySequence<T> = {
    readonly first: T
    readonly rest: LazySequence<T>
}

export const lazyUndefined
    = () => undefined

export type Sequence<T> = NonEmptySequence<T> | undefined

export const just
    : <T>(_: T) => NonEmptySequence<T>
    = first => ({ first, rest: lazyUndefined })

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
        const main
            : (_: R) => State<T, R>
            = value => ({
                value,
                next: v => main(reduce(value)(v))
            })
        return main
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

export type FlatState<T, R> = State<T, Sequence<R>>

export const flatScan
    : <T, R>(_: FlatState<T, R>) => (_: Sequence<T>) => Sequence<R>
    = state => sequence => flatten(exclusiveScan(state)(sequence))

export type FilterState<T> = State<T, boolean>

export type NextFilterState<T> = NextState<T, boolean>

export const scanFilter
    : <T>(_: NextFilterState<T>) => (_: Sequence<T>) => Sequence<T>
    = nextFilterState => optional.map(({ first, rest }) => {
        const { value, next } = nextFilterState(first)
        const nextState = () => scanFilter(next)(rest())
        return value ? { first, rest: nextState } : nextState()
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
            = optional.map(({ first, rest }) => p(first) ? result(rest()) : { first, rest })
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
    = eq => {
        type T = typeof eq extends equal.Equal<infer _T> ? _T : never
        const createState
            : (_: boolean) => (_: T) => FilterState<T>
            = value => current => ({
                value,
                next: nextState(current)
            })
        const nextState
            : (_: T) => (_: T) => FilterState<T>
            = prior => current => createState(!eq(prior)(current))(current)
        return createState(true)
    }

export const dedup
    : <T>(_: equal.Equal<T>) => (_: Sequence<T>) => Sequence<T>
    = eq => scanFilter(dedupNextState(eq))

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
        const restSequence = rest()
        // Hopefully, last() is PTC (proper tail call).
        // Link: https://webkit.org/blog/6240/ecmascript-6-proper-tail-calls-in-webkit/
        return restSequence === undefined ? first : last(restSequence)
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

const reverseTail
    : <T>(_: Sequence<T>) => (_: Sequence<T>) => Sequence<T>
    = tail => sequence => sequence === undefined
        ? tail
        // Tail recursion
        : reverseTail({ first: sequence.first, rest: () => tail })(sequence.rest())

export const reverse
    : <T>(_: Sequence<T>) => Sequence<T>
    = reverseTail(undefined)

const concatFront
    : <T>(_: LazySequence<T>) => (_: Sequence<T>) => Sequence<T>
    = b => {
        type S = typeof b extends () => (infer U) ? U : never
        const main
            : (_: S) => S
            = a => a === undefined ? b() : { first: a.first, rest: () => main(a.rest()) }
        return main
    }

export const concat
    : <T>(_: Sequence<T>) => (_: Sequence<T>) => Sequence<T>
    = a => b => concatFront(() => b)(a)

const foldSizeState
    : (_: number) => <T>(_: Sequence<T>) => number
    = value => sequence => sequence === undefined ? value : foldSizeState(value + 1)(sequence.rest())

export const size
    : <T>(_: Sequence<T>) => number
    = foldSizeState(0)
