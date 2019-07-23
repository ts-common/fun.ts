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
    readonly value: First<T>
    readonly next: () => IntervalLeftSequence<E, T>
}

export const fromArray
    : <T>(_: T) => <E>(_: readonly IntervalLeft<E, T>[]) => IntervalSequence<E, T>
    = value => next => ({
        value: { value },
        next: () => sequence.fromArray(next)
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
                const { value, next } = main(a)(b)
                return { value: { edge, value: value.value }, next }
            }
        const main
            : (_: IntervalSequence<E, A>) => (_: IntervalSequence<E, B>) => IntervalSequence<E, R>
            = a => b => ({
                value: { value: reduce(a.value.value)(b.value.value) },
                next: () => {
                    const aNext = a.next()
                    const bNext = b.next()
                    const aShift
                        : (_: sequence.NonEmptySequence<IntervalLeft<E, A>>) => IntervalLeftSequence<E, R>
                        = n => intervalLeftSequence(n.value.edge)(n)(b)
                    const bShift
                        : (_: sequence.NonEmptySequence<IntervalLeft<E, B>>) => IntervalLeftSequence<E, R>
                        = n => intervalLeftSequence(n.value.edge)(a)(n)
                    if (aNext === undefined) {
                        if (bNext === undefined) {
                            return undefined
                        }
                        return bShift(bNext)
                    }
                    if (bNext === undefined) {
                        return aShift(aNext)
                    }
                    switch (strategy.sign(aNext.value.edge)(bNext.value.edge)) {
                        case -1:
                            return aShift(aNext)
                        case 1:
                            return bShift(bNext)
                        default:
                            return intervalLeftSequence(aNext.value.edge)(aNext)(bNext)
                    }
                }
            })
        const dedupEqual
            : (_: First<R>) => (_: IntervalLeft<E, R>) => boolean
            = a => b => strategy.equal(a.value)(b.value)
        const result
            : (_: IntervalSequence<E, A>) => (_: IntervalSequence<E, B>) => IntervalSequence<E, R>
            = a => b => {
                const { value, next } = main(a)(b)
                return { value, next: () => sequence.dedup(dedupEqual)(sequence.dropWhile(dedupEqual(value))(next())) }
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
            value: { value: undefined },
            next: () => sequence.fromArray([
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
