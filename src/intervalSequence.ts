import * as sequence from './sequence'
import * as equal from './equal'
import * as sign from './sign'

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

export type IntervalLeftSequence<E, T> = sequence.Sequence<IntervalLeft<E, T>>

export type First<T> = {
    readonly value: T
}

export type IntervalSequence<E, T> = {
    readonly first: First<T>
    readonly rest: () => IntervalLeftSequence<E, T>
}

export const fromArray
    : <T>(_: T) => <E>(_: readonly IntervalLeft<E, T>[]) => IntervalSequence<E, T>
    = value => next => ({
        first: { value },
        rest: () => sequence.fromArray(next)
    })

export type Strategy<E, T> = {
    readonly sign: sign.Compare<E>
    readonly equal: equal.Equal<T>
}

export type Reduce<A, B, R> = (_: A) => (_: B) => R

export type Merge
    = <E, R>(_: Strategy<E, R>)
        => <A, B>(_: Reduce<A, B, R>)
            => (_: IntervalSequence<E, A>)
                => (_: IntervalSequence<E, B>)
                    => IntervalSequence<E, R>

export const merge
    : Merge
    = strategy => reduce => {
        type StrategyTypes = typeof strategy extends Strategy<infer _E, infer _R> ? readonly [_E, _R] : never
        type E = StrategyTypes[0]
        type R = StrategyTypes[1]
        type ReduceTypes = typeof reduce extends Reduce<infer _A, infer _B, infer _R> ? readonly [_A, _B, _R] : never
        type A = ReduceTypes[0]
        type B = ReduceTypes[1]
        const intervalLeftSequence
            : (_: E)
                => (_: IntervalSequence<E, A>)
                    => (_: IntervalSequence<E, B>)
                        => IntervalLeftSequence<E, R>
            = edge => a => b => {
                const { first, rest } = main(a)(b)
                return { first: { edge, value: first.value }, rest }
            }
        const main
            : (_: IntervalSequence<E, A>) => (_: IntervalSequence<E, B>) => IntervalSequence<E, R>
            = a => b => ({
                first: { value: reduce(a.first.value)(b.first.value) },
                rest: () => {
                    const aNext = a.rest()
                    const bNext = b.rest()
                    const aShift
                        : (_: sequence.NonEmptySequence<IntervalLeft<E, A>>) => IntervalLeftSequence<E, R>
                        = n => intervalLeftSequence(n.first.edge)(n)(b)
                    const bShift
                        : (_: sequence.NonEmptySequence<IntervalLeft<E, B>>) => IntervalLeftSequence<E, R>
                        = n => intervalLeftSequence(n.first.edge)(a)(n)
                    if (aNext === undefined) {
                        if (bNext === undefined) {
                            return undefined
                        }
                        return bShift(bNext)
                    }
                    if (bNext === undefined) {
                        return aShift(aNext)
                    }
                    switch (strategy.sign(aNext.first.edge)(bNext.first.edge)) {
                        case -1:
                            return aShift(aNext)
                        case 1:
                            return bShift(bNext)
                        default:
                            return intervalLeftSequence(aNext.first.edge)(aNext)(bNext)
                    }
                }
            })
        const dedupEqual
            : (_: First<R>) => (_: IntervalLeft<E, R>) => boolean
            = a => b => strategy.equal(a.value)(b.value)
        const result
            : (_: IntervalSequence<E, A>) => (_: IntervalSequence<E, B>) => IntervalSequence<E, R>
            = a => b => {
                const { first, rest } = main(a)(b)
                return { first, rest: () => sequence.dedup(dedupEqual)(sequence.dropWhile(dedupEqual(first))(rest())) }
            }
        return result
    }

export type Add
    = <E, A>(_: Strategy<E, A>)
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
            first: { value: undefined },
            rest: () => sequence.fromArray([
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
