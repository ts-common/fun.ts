/*
import * as sequence from './sequence'
import * as intervalSequence from './intervalSequence'

export type Kind = 'leaf' | 'node'

export type Leaf<T> = {
    readonly kind: 'leaf'
    readonly value: T
}

export type Node<E, T> = {
    readonly kind: 'node'
    readonly edge: E
    readonly left: IntervalMap<E, T>
    readonly right: IntervalMap<E, T>
}

export type IntervalMap<E, T> = Node<E, T> | Leaf<T>

type MapLimitResult<E, T> = {
    readonly map: IntervalMap<E, T>
    readonly rest: sequence.Sequence<intervalSequence.IntervalLeft<E, T>>
}

const levelUp
    : <E, T>(_: intervalSequence.IntervalSequence<E, T>)
        => (_: number)
        => (_: IntervalMap<E, T>)
        => sequence.Sequence<intervalSequence.IntervalLeft<E, T>>
    = ;

const mapLimit
    : <E, T>(_: intervalSequence.IntervalSequence<E, T>) => (_: number) => MapLimitResult<E, T>
    = s => {
        type S = typeof s extends intervalSequence.IntervalSequence<infer _E, infer _T> ? readonly [_E, _T]: never
        type E = S[0]
        type T = S[1]
        const main
            : (_: number) => MapLimitResult<E, T>
            = limit => {
                if (limit === 0 || s.rest === undefined) {
                    return { map: { kind: 'leaf', value: s.first }, rest: s.rest }
                }
                const left = main(limit - 1)
                const middle = left.rest
                if (middle === undefined) {
                    return left
                }
                const middleValue = middle.value
                const right = mapLimit({ first: middleValue.value, rest: middle.next() })(limit - 1)
                return {
                    map: {
                        kind: 'node',
                        edge: middleValue.edge,
                        left: left.map,
                        right: right.map,
                    },
                    rest: right.rest
                }
            }
        return main
    }

export const map
    : <E, T>(_: intervalSequence.IntervalSequence<E, T>) => IntervalMap<E, T>
    = ({ first, rest }) => rest === undefined ? ({ kind: 'leaf', value: first }) :
*/
