// import * as sequence from './sequence'
import * as equal from './equal'
import * as sign from './sign'

export type IntervalSequence<E, T> = {
    readonly value: T
    readonly edge: () => Edge<E, T> | undefined
}

export type Edge<E, T> = {
    readonly value: E
    readonly interval: IntervalSequence<E, T>
}

export type Strategy<E, T> = {
    readonly sign: sign.Compare<E>
    readonly equal: equal.Equal<T>
}

export type Reduce<A, B, R> = (_: A) => (_: B) => R

export type MergeStrategy<E, A, B, R> = {
    readonly intervalSequence: Strategy<E, R>
    readonly reduce: Reduce<A, B, R>
}

export type Merge
    = <E, A, B, R>(_: MergeStrategy<E, A, B, R>)
    => (_: IntervalSequence<E, A>)
    => (_: IntervalSequence<E, B>)
    => IntervalSequence<E, R>

export const merge
    : Merge
    = strategy => {
        type S = typeof strategy extends MergeStrategy<infer _E, infer _A, infer _B, infer _R>
            ? readonly [_E, _A, _B, _R]
            : never
        type E = S[0]
        type A = S[1]
        type B = S[2]
        type R = S[3]
        type ASequence = IntervalSequence<E, A>
        type BSequence = IntervalSequence<E, B>
        type RSequence = IntervalSequence<E, R>
        const edge
            : (_: ASequence) => (_: BSequence) => () => Edge<E, R> | undefined
            = a => b => {
                const aEdge = a.edge()
                const bEdge = b.edge()
                const nextA
                    : (_: Edge<E, A>) => () => Edge<E, R>
                    = ({ value, interval }) => () => ({ value, interval: main(interval)(b) })
                const nextB
                    : (_: Edge<E, B>) => () => Edge<E, R>
                    = e => () => ({ value: e.value, interval: main(a)(e.interval) })
                if (aEdge === undefined) {
                    if (bEdge === undefined) {
                        return () => undefined
                    }
                    return nextB(bEdge)
                }
                if (bEdge === undefined) {
                    return nextA(aEdge)
                }
                switch (strategy.intervalSequence.sign(aEdge.value)(bEdge.value)) {
                    case -1:
                        return nextA(aEdge)
                    case 1:
                        return nextB(bEdge)
                    case 0:
                    default:
                        return () => ({ value: aEdge.value, interval: main(aEdge.interval)(bEdge.interval) })
                }
            }
        const main
            : (_: ASequence) => (_: BSequence) => IntervalSequence<E, R>
            = a => b => ({ value: strategy.reduce(a.value)(b.value), edge: edge(a)(b) })
        const dedup
            : (_: RSequence) => RSequence
            = r => {
                const e = r.edge()
                if (e === undefined) {
                    return r
                }
                const { value } = r
                const { interval } = e
                return strategy.intervalSequence.equal(value)(interval.value)
                    ? dedup({ value, edge: interval.edge })
                    : { value, edge: () => ({ value: e.value, interval: dedup(interval) }) }
            }
        return main
    }

/*
// [edge, +Infinity)
export type IntervalLeft<E, T> = {
    readonly edge: E
    readonly value: T
}

export type IntervalSequence<E, T> = {
    readonly first: T
    readonly rest: sequence.Sequence<IntervalLeft<E, T>>
}

export type Strategy<E, T> = {
    readonly sign: sign.Compare<E>
    readonly equal: equal.Equal<T>
}

export type Reduce<A, B, R> = (_: A) => (_: B) => R

export type MergeStrategy<E, A, B, R> = {
    readonly intervalSequence: Strategy<E, R>
    readonly reduce: Reduce<A, B, R>
}

type DropResult<E, T> = {
    readonly map: IntervalSequence<E, T>
    readonly edge: E
}

const drop
    : <E, T>(list: sequence.NonEmptySequence<IntervalLeft<E, T>>) => DropResult<E, T>
    = ({ value, next }) => ({
        map: {
            first: value.value,
            rest: next()
        },
        edge: value.edge
    })

export type Merge
    = <E, A, B, R>(_: MergeStrategy<E, A, B, R>)
    => (_: IntervalSequence<E, A>)
    => (_: IntervalSequence<E, B>)
    => IntervalSequence<E, R>

type Pair<E, A, B> = {
    readonly a: IntervalSequence<E, A>
    readonly b: IntervalSequence<E, B>
}

export const merge
    : Merge
    = ({ intervalSequence, reduce }) => {
        type S = typeof intervalSequence extends Strategy<infer _E, infer _R>
            ? readonly [_E, _R]
            : never
        type E = S[0]
        type R = S[1]
        type RA = typeof reduce extends Reduce<infer _A, infer _B, infer _R> ? readonly [_A, _B, _R] : never
        type A = RA[0]
        type B = RA[1]
        const next
            : (_: E) => (_: Pair<E, A, B>) => sequence.NonEmptySequence<IntervalLeft<E, R>>
            = edge => p => ({
                value: { edge, value: reduce(p.a.first)(p.b.first) },
                next: () => listMerge(p)
            })
        const listMerge
            : (_: Pair<E, A, B>) => sequence.Sequence<IntervalLeft<E, R>>
            = ({ a, b }) => {
                const aRest = a.rest
                const bRest = b.rest
                if (aRest === undefined) {
                    if (bRest === undefined) {
                        return undefined
                    }
                    const { map, edge } = drop(bRest)
                    return next(edge)({ a, b: map })
                }
                if (bRest === undefined) {
                    const { map, edge } = drop(aRest)
                    return next(edge)({ a: map, b })
                }
                const aEdge = aRest.value.edge
                const bEdge = bRest.value.edge
                switch (intervalSequence.sign(aEdge)(bEdge)) {
                    // If aEdge < bEdge
                    case -1: {
                        const { map, edge } = drop(aRest)
                        return next(edge)({ a: map, b })
                    }
                    // If aEdge > bEdge
                    case 1: {
                        const { map, edge } = drop(bRest)
                        return next(edge)({ a, b: map })
                    }
                    // If aEdge === bEdge
                    default: {
                        const aDrop = drop(aRest)
                        const bDrop = drop(bRest)
                        return next(aDrop.edge)({ a: aDrop.map, b: bDrop.map })
                    }
                }
            }
        const dedupEqual
            : (_: IntervalLeft<E, R>) => (_: IntervalLeft<E, R>) => boolean
            = a => b => intervalSequence.equal(a.value)(b.value)
        return a => b => ({
            first: reduce(a.first)(b.first),
            rest: sequence.dedup(dedupEqual)(listMerge({ a, b }),
        })
    }
*/
