import * as sequence from './sequence'
import * as equal from './equal'
import * as sign from './sign'

// [min, +Infinity)
export type IntervalLeft<E, T> = {
    readonly min: E
    readonly value: T
}

// [min, max)
export type Interval<E, T> = {
    readonly min: E
    readonly excludedMax: E
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
    readonly compare: sign.Compare<E>
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
    = strategy => {
        type StrategyTypes = typeof strategy extends Strategy<infer _E, infer _R> ? readonly [_E, _R] : never
        type E = StrategyTypes[0]
        type R = StrategyTypes[1]
        const rDedup = dedup(strategy.equal)
        return reduce => {
            type ReduceTypes = typeof reduce extends Reduce<infer _A, infer _B, infer _R>
                ? readonly [_A, _B, _R]
                : never
            type A = ReduceTypes[0]
            type B = ReduceTypes[1]
            const intervalLeftSequence
                : (_: E)
                    => (_: IntervalSequence<E, A>)
                    => (_: IntervalSequence<E, B>)
                    => IntervalLeftSequence<E, R>
                = min => a => b => {
                    const { first, rest } = main(a)(b)
                    return { first: { min, value: first.value }, rest }
                }
            const main
                : (_: IntervalSequence<E, A>) => (_: IntervalSequence<E, B>) => IntervalSequence<E, R>
                = a => b => ({
                    first: { value: reduce(a.first.value)(b.first.value) },
                    rest: () => {
                        const aRest = a.rest()
                        const bRest = b.rest()
                        const aShift
                            : (_: sequence.NonEmptySequence<IntervalLeft<E, A>>) => IntervalLeftSequence<E, R>
                            = n => intervalLeftSequence(n.first.min)(n)(b)
                        const bShift
                            : (_: sequence.NonEmptySequence<IntervalLeft<E, B>>) => IntervalLeftSequence<E, R>
                            = n => intervalLeftSequence(n.first.min)(a)(n)
                        if (aRest === undefined) {
                            if (bRest === undefined) {
                                return undefined
                            }
                            return bShift(bRest)
                        }
                        if (bRest === undefined) {
                            return aShift(aRest)
                        }
                        switch (strategy.compare(aRest.first.min)(bRest.first.min)) {
                            case -1:
                                return aShift(aRest)
                            case 1:
                                return bShift(bRest)
                            default:
                                return intervalLeftSequence(aRest.first.min)(aRest)(bRest)
                        }
                    }
                })
            return a => b => rDedup(main(a)(b))
        }
    }

const dedup
    : <T>(_: equal.Equal<T>) => <E>(_: IntervalSequence<E, T>) => IntervalSequence<E, T>
    = e => ({ first, rest }) => {
        type Types = typeof rest extends () => IntervalLeftSequence<infer _E, infer _T> ? readonly [_E, _T] : never
        type E = Types[0]
        type T = Types[1]
        const dedupEqual
            : (_: First<T>) => (_: IntervalLeft<E, T>) => boolean
            = a => b => e(a.value)(b.value)
        return {
            first,
            rest: () => sequence.dedup(dedupEqual)(sequence.dropWhile(dedupEqual(first))(rest()))
        }
    }

export const fromInterval
    : <E, A>(_: Interval<E, A>) => IntervalSequence<E, A | undefined>
    = ({ min, excludedMax, value }) => ({
        first: { value: undefined },
        rest: () => sequence.fromArray([
            { min, value },
            { min: excludedMax, value: undefined }
        ])
    })

export type Add
    = <E, A>(_: Strategy<E, A>)
    => (_: IntervalSequence<E, A>)
    => (_: Interval<E, A>)
    => IntervalSequence<E, A>

type AddReduce<T> = Reduce<T, T | undefined, T>

const addReduce
    : <A>(_: A) => (_: A | undefined) => A
    = a => b => b === undefined ? a : b

export const add
    : Add
    = strategy => {
        type EA = typeof strategy extends Strategy<infer _E, infer _A>
            ? readonly [_E, _A] : never
        type A = EA[1]

        const reduce
            : AddReduce<A>
            = addReduce

        return current => interval => merge(strategy)(reduce)(current)(fromInterval(interval))
    }

export const map
    : <R>(_: equal.Equal<R>) => <T>(_: (_: T) => R) => <E>(_: IntervalSequence<E, T>) => IntervalSequence<E, R>
    = e => f => {
        type TR = typeof f extends (_: infer _T) => infer _R ? readonly [_T, _R] : never
        type T = TR[0]
        type R = TR[1]
        const m
            : <E>(_: IntervalLeftSequence<E, T>) => IntervalLeftSequence<E, R>
            = sequence.map(({ min, value }) => ({ min, value: f(value) }))
        const d = dedup(e)
        return ({ first, rest }) => d({
            first: { value: f(first.value) },
            rest: () => m(rest())
        })
    }
