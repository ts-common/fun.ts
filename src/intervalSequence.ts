import * as sequence from './sequence'
import * as equal from './equal'
import * as sign from './sign'
import * as predicate from './predicate'

// [edge, +Infinity)
export type IntervalLeft<E, T> = {
    readonly edge: E
    readonly value: T
}

// [min, max)
export type Interval<E, T> = {
    readonly min: E
    readonly max: E
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

export type Reduce<A, B, R> = (_: A) => (_: B) => R

export type Merge
    = <E, R>(_: Strategy<E, R>)
    => <A, B>(_: Reduce<A, B, R>)
    => (_: IntervalSequence<E, A>)
    => (_: IntervalSequence<E, B>)
    => IntervalSequence<E, R>

type Pair<E, A, B> = {
    readonly a: IntervalSequence<E, A>
    readonly b: IntervalSequence<E, B>
}

export const merge
    : Merge
    = strategy => reduce => {
        type S = typeof strategy extends Strategy<infer _E, infer _R>
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
                switch (strategy.sign(aEdge)(bEdge)) {
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
            = a => b => strategy.equal(a.value)(b.value)
        const result
            : (_: IntervalSequence<E, A>) => (_: IntervalSequence<E, B>) => IntervalSequence<E, R>
            = a => b => {
                const first = reduce(a.first)(b.first)
                const rest = sequence.dedup(dedupEqual)(listMerge({ a, b }))

                // need to drop initial intervals that are the same value as the first
                const isSameAsFisrt
                    : predicate.Predicate<IntervalLeft<E, R>>
                    = p => strategy.equal(p.value)(first)

                const uniqueRest = sequence.dropWhile(isSameAsFisrt)(rest)

                return {
                    first,
                    rest: uniqueRest,
                }
            }
        return result
    }

export type Add
    =  <E, A>(_: Strategy<E, A>)
    => (_: IntervalSequence<E, A>)
    => (_: Interval<E, A | undefined>)
    => IntervalSequence<E, A>

export const add
    : Add
    = strategy => current => toAdd => {
        type EA = typeof current extends IntervalSequence<infer _E, infer _A>
            ? readonly [_E, _A] : never
        type E = EA[0]
        type A = EA[1]

        const mergeSeq: IntervalSequence<E, A | undefined> = {
            first: undefined,
            rest: sequence.fromArray([
                { edge: toAdd.min, value: toAdd.value },
                { edge: toAdd.max, value: undefined }
            ])
        }

        const reduce
            : (_: A) => (_: A | undefined) => A
            = a => b => b === undefined ? a : b

        const result
            : IntervalSequence<E, A>
            = merge<E, A>(strategy)<A, A | undefined>(reduce)(current)(mergeSeq)

        return result
    }
