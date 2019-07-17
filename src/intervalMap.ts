import * as it from '@ts-common/iterator'

// Format: [leftEdge, -Infinity) maps to `value`.
type IntervalLeft<E, T> = {
    readonly leftEdge: E
    readonly value: T
}

type IntervalStrategy<E, T> = {
    readonly less: Less<E>
    readonly isSuccessor: IsSuccessor<E>
    readonly equal: Equal<T>
}

type IntervalList<E, T> = {
    readonly first: T
    readonly rest: it.Iterable<IntervalLeft<E, T>>
}

type CachedIntervalList<E, T> = {
    readonly rest: readonly IntervalLeft<E, T>[]
} & IntervalList<E, T>

const cache
    : <E, T>(_: IntervalList<E, T>) => CachedIntervalList<E, T>
    = i => ({ ...i, rest: it.toArray(i.rest) })

// Returns `true` if the first argument is less than the second.
type Less<E> = (_: E) => (_: E) => boolean

// Returns `true` if the second argument is a successor of the first argument.
type IsSuccessor<T> = (_: T) => (_: T) => boolean

// Returns `true` if the the given arguments are equal.
type Equal<T> = (_: T) => (_: T) => boolean

// Converts a pair of A and B values to R.
type Reduce<A, B, R> = (_: A) => (_: B) => R

type MergeStrategy<E, A, B, R> = {
    readonly interval: IntervalStrategy<E, R>
    readonly reduce: Reduce<A, B, R>
}

const mergeSeq
    : <E>(_: Less<E>) => <A>(_: IntervalList<E, A>) => <B>(_: IntervalList<E, B>) => Iterable<E, readonly [A, B]>
    = less => a => b => it.iterable(function *() {
        const ai = a.rest[Symbol.iterator]()
        const bi = b.rest[Symbol.iterator]()
        let av = a.first
        let bv = b.first
        let aiv = ai.next()
        let biv = bi.next()
        // tslint:disable-next-line:no-loop-statement
        while (true) {
            if (aiv.done) {
                return
            }
            if (biv.done) {
                return
            }
            if (less(aiv.value.leftEdge)(biv.value.leftEdge)) {
                aiv = ai.next()
            } else {
                biv = bi.next()
            }
        }
    })

const merge
    : <E, A, B, R>(_: MergeStrategy<E, A, B, R>)
        => (_: IntervalList<E, A>)
        => (_: IntervalList<E, B>)
        => IntervalList<E, R>
    = strategy => a => b => {
        const first = strategy.reduce(a.first)(b.first)
        return {
            first,
            rest: []
        }
    }
