import * as it from '@ts-common/iterator'

// Format: (-Infinity, rightEdge] maps to `value`.
type IntervalRight<E, T> = {
    readonly value: T
    readonly rightEdge: E
}

type IntervalList<E, T> = {
    readonly list: it.Iterable<IntervalRight<E, T>>
    readonly last: T
}

type CachedIntervalList<E, T> = {
    readonly list: readonly IntervalRight<E, T>[]
} & IntervalList<E, T>

const cache
    : <E, T>(_: IntervalList<E, T>) => CachedIntervalList<E, T>
    = i => ({ ...i, list: it.toArray(i.list) })

// Returns `true` if the first argument is less than the second.
type Less<E> = (_: E) => (_: E) => boolean

// Returns `true` if the second argument is a successor of the first argument.
type IsSuccessor<T> = (_: T) => (_: T) => boolean

// Returns `true` if the the given arguments are equal.
type Equal<T> = (_: T) => (_: T) => boolean

// Converts a pair of A and B values to R.
type Reduce<A, B, R> = (_: A) => (_: B) => R

type MergeStrategy<E, A, B, R> = {
    readonly less: Less<E>
    readonly isSuccessor: IsSuccessor<E>
    readonly equal: Equal<R>
    readonly reduce: Reduce<A, B, R>
}

const merge
    : <E, A, B, R>(_: MergeStrategy<E, A, B, R>)
        => (_: IntervalList<E, A>)
        => (_: IntervalList<E, B>)
        => IntervalList<E, R>
    = strategy => a => b => ({
        list: [],
        last: strategy.reduce(a.last)(b.last)
    })
