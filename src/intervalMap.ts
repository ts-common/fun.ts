import * as sequence from './sequence'
import * as equal from './equal'
import * as sign from './sign'

// [edge, +Infinity)
export type IntervalLeft<E, T> = {
    readonly edge: E
    readonly value: T
}

export type IntervalMap<E, T> = {
    readonly first: T
    readonly rest: sequence.Sequence<IntervalLeft<E, T>>
}

export type Strategy<E, T> = {
    readonly sign: sign.Compare<E>
    readonly equal: equal.Equal<T>
}

export type MergeStrategy<E, A, B, R> = {
    readonly intervalMap: Strategy<E, R>
    readonly reduce: Reduce<A, B, R>
}

type DropResult<E, T> = {
    readonly map: IntervalMap<E, T>
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

export type Reduce<A, B, R> = (_: A) => (_: B) => R

export type Merge =
    <E, A, B, R>(_: MergeStrategy<E, A, B, R>) => (_: IntervalMap<E, A>) => (_: IntervalMap<E, B>) => IntervalMap<E, R>

type Pair<E, A, B> = {
    readonly a: IntervalMap<E, A>
    readonly b: IntervalMap<E, B>
}

export const merge
    : Merge
    = ({ intervalMap, reduce }) => {
        type S = typeof intervalMap extends Strategy<infer _E, infer _R>
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
                value: { value: reduce(p.a.first)(p.b.first), edge },
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
                switch (intervalMap.sign(aEdge)(bEdge)) {
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
            = a => b => intervalMap.equal(a.value)(b.value)
        const result
            : (_: IntervalMap<E, A>) => (_: IntervalMap<E, B>) => IntervalMap<E, R>
            = a => b => {
                const first = reduce(a.first)(b.first)
                const rest = sequence.dedup(dedupEqual)(listMerge({ a, b }))
                return {
                    first,
                    rest,
                }
            }
        return result
    }
