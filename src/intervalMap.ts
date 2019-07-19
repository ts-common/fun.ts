import * as sequence from './sequence'

export type IntervalLeft<E, T> = {
    readonly edge: E
    readonly value: T
}

export type IntervalMap<E, T> = {
    readonly first: T
    readonly list?: sequence.Sequence<IntervalLeft<E, T>>
}

export type DropResult<E, T> = {
    readonly map: IntervalMap<E, T>
    readonly edge: E
}

export const drop
    : <E, T>(list: sequence.Sequence<IntervalLeft<E, T>>) => DropResult<E, T>
    = ({ value, next }) => ({
        map: {
            first: value.value,
            list: next()
        },
        edge: value.edge
    })

export type SignType = -1 | 0 | 1

export type Sign<E> = (_: E) => (_: E) => SignType

export type MergeStrategy<E, A, B, R> = {
    readonly sign: Sign<E>
    readonly reduce: Reduce<A, B, R>
}

export type Reduce<A, B, R> = (_: A) => (_: B) => R

export type Merge =
    <E, A, B, R>(_: MergeStrategy<E, A, B, R>) => (_: IntervalMap<E, A>) => (_: IntervalMap<E, B>) => IntervalMap<E, R>

type Pair<E, A, B> = {
    readonly a: IntervalMap<E, A>
    readonly b: IntervalMap<E, B>
}

/*
export const dedup
    : <E, T>(_: IntervalMap<E, T>) => IntervalMap<E, T>
    = ({ first }) => ({
        first,
        // A list: sequence.scan()
    })
*/

export const merge
    : Merge
    = strategy => {
        type S = typeof strategy extends MergeStrategy<infer TE, infer TA, infer TB, infer TR>
            ? readonly [TE, TA, TB, TR]
            : never
        type E = S[0]
        type A = S[1]
        type B = S[2]
        type R = S[3]
        const s
            : (_: E) => (_: Pair<E, A, B>) => sequence.Sequence<IntervalLeft<E, R>>
            = edge => p => ({
                value: { value: strategy.reduce(p.a.first)(p.b.first), edge },
                next: () => f(p)
            })
        const f
            : (_: Pair<E, A, B>) => sequence.Sequence<IntervalLeft<E, R>> | undefined
            = ({ a, b }) => {
                const aList = a.list
                const bList = b.list
                if (aList === undefined) {
                    if (bList === undefined) {
                        return undefined
                    }
                    const { map, edge } = drop(bList)
                    return s(edge)({ a, b: map })
                }
                if (bList === undefined) {
                    const { map, edge } = drop(aList)
                    return s(edge)({ a: map, b })
                }
                const aEdge = aList.value.edge
                const bEdge = bList.value.edge
                const sign = strategy.sign(aEdge)(bEdge)
                switch (sign) {
                    // If aEdge < bEdge
                    case -1: {
                        const { map, edge } = drop(aList)
                        return s(edge)({ a: map, b })
                    }
                    // If aEdge > bEdge
                    case 1: {
                        const { map, edge } = drop(bList)
                        return s(edge)({ a, b: map })
                    }
                    // If aEdge === bEdge
                    default: {
                        const aDrop = drop(aList)
                        const bDrop = drop(bList)
                        return s(aDrop.edge)({ a: aDrop.map, b: bDrop.map })
                    }
                }
            }
        const r
            : (_: IntervalMap<E, A>) => (_: IntervalMap<E, B>) => IntervalMap<E, R>
            = a => b => {
                const first = strategy.reduce(a.first)(b.first)
                const list = f({ a, b })
                return {
                    first,
                    list,
                }
            }
        return r
    }
