import * as sequence from './sequence'
import * as equal from './equal'
import * as sign from './sign'
import * as predicate from './predicate'

// [edge, +Infinity)
export type IntervalLeft<E, T> = {
    readonly edge: E
    readonly value: T
}

export type IntervalSequence<E, T> = sequence.NonEmptySequence<IntervalLeft<E, T>>

export type Strategy<E, T> = {
    readonly min: E
    readonly sign: sign.Compare<E>
    readonly equal: equal.Equal<T>
}

export type MergeStrategy<E, A, B, R> = {
    readonly intervalSequence: Strategy<E, R>
    readonly reduce: Reduce<A, B, R>
}

/*
type DropResult<E, T> = {
    readonly map: IntervalSequence<E, T>
    readonly edge: E
}
*/

/*
const drop
    : <E, T>(list: sequence.NonEmptySequence<IntervalLeft<E, T>>) => DropResult<E, T>
    = ({ value, next }) => ({
        map: {
            first: value.value,
            rest: next()
        },
        edge: value.edge
    })
    */

export type Reduce<A, B, R> = (_: A) => (_: B) => R

export type Merge
    = <E, A, B, R>(_: MergeStrategy<E, A, B, R>)
    => (_: IntervalSequence<E, A>)
    => (_: IntervalSequence<E, B>)
    => IntervalSequence<E, R>

export const merge
    : Merge
    = strategy => {
        type Types = typeof strategy extends MergeStrategy<infer _E, infer _A, infer _B, infer _R>
            ? readonly [_E, _A, _B, _R]
            : never
        type E = Types[0]
        type A = Types[1]
        type B = Types[2]
        type R = Types[3]
        type IntervalSequenceA = IntervalSequence<E, A>
        type IntervalSequenceB = IntervalSequence<E, B>
        type IntervalSequenceR = IntervalSequence<E, R>
        const main
            : (_: E) => (_: IntervalSequenceA) => (_: IntervalSequenceB) => IntervalSequenceR
            = edge => a => b => ({
                value: { edge, value: strategy.reduce(a.value.value)(b.value.value) },
                next: () => {
                    const aNext = a.next()
                    const bNext = b.next()
                    if (aNext === undefined) {
                        if (bNext === undefined) {
                            return undefined
                        }
                        return main(bNext.value.edge)(a)(bNext)
                    }
                    if (bNext === undefined) {
                        return main(aNext.value.edge)(aNext)(b)
                    }
                    switch (strategy.intervalSequence.sign(aNext.value.edge)(bNext.value.edge)) {
                        case -1:
                            return main(aNext.value.edge)(aNext)(b)
                        case 1:
                            return main(bNext.value.edge)(a)(bNext)
                        case 0:
                        default:
                            return main(aNext.value.edge)(aNext)(bNext)
                    }
                }
            })
        const valueEqual
            : (_: IntervalLeft<E, R>) => (_: IntervalLeft<E, R>) => boolean
            = a => b => strategy.intervalSequence.equal(a.value)(b.value)
        return a => b => sequence.dedup(valueEqual)(main(strategy.intervalSequence.min)(a)(b))
    }

/*
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
                value: { value: reduce(p.a.value)(p.b.first), edge },
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
        const result
            : (_: IntervalSequence<E, A>) => (_: IntervalSequence<E, B>) => IntervalSequence<E, R>
            = a => b => {
                const first = reduce(a.first)(b.first)
                const rest = sequence.dedup(dedupEqual)(listMerge({ a, b }))

                // need to drop initial intervals that are the same value as the first
                const isSameAsFisrt
                    : predicate.Predicate<IntervalLeft<E, R>>
                    = p => intervalSequence.equal(p.value)(first)

                const uniqueRest = sequence.dropWhile(isSameAsFisrt)(rest)

                return {
                    first,
                    rest: uniqueRest,
                }
            }
        return result
    }
*/