// import * as sequence from './sequence'
import * as equal from './equal'
import * as sign from './sign'

export type IntervalSequence<E, T> = {
    readonly value: T
    readonly edge: () => Edge<E, T> | undefined
}

// [edge, +Infinity) => value
export type IntervalLeft<E, T> = {
    readonly edge: E
    readonly value: T
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
        return a => b => {
            const result = main(a)(b)
            return dedup(result)
        }
    }
