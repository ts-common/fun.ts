import * as intervalSequence from './intervalSequence'
import * as sequence from './sequence'

export type Node<E, T> = {
    readonly kind: 'node'
    readonly left: IntervalMap<E, T>
    readonly rightMin: E
    readonly right: IntervalMap<E, T>
}

export type Leaf<T> = {
    readonly kind: 'leaf'
    readonly value: T
}

export type IntervalMap<E, T> = Node<E, T> | Leaf<T>

type LimitedMap<E, T> = {
    readonly map: IntervalMap<E, T>
    readonly rest: intervalSequence.IntervalLeftSequence<E, T>
}

const addRoot
    : <E, T>(_: IntervalMap<E, T>)
        => (_: sequence.NonEmptySequence<intervalSequence.IntervalLeft<E, T>>)
        => (_: number)
        => LimitedMap<E, T>
    = left => rest => limit => {
        const right = limitedMap(rest)(limit)
        return {
            map: {
                kind: 'node',
                left,
                rightMin: rest.first.min,
                right: right.map
            },
            rest: right.rest
        }
    }

const map0
    : <E, T>(_: intervalSequence.IntervalSequence<E, T>) => LimitedMap<E, T>
    = ({ first, rest }) => ({ map: { kind: 'leaf', value: first.value }, rest: rest() })

const limitedMap
    : <E, T>(_: intervalSequence.IntervalSequence<E, T>) => (_: number) => LimitedMap<E, T>
    = is => {
        type Types = typeof is extends intervalSequence.IntervalSequence<infer _E, infer _T>
            ? readonly [_E, _T] : never
        type E = Types[0]
        type T = Types[1]
        const main
            : (_: number) => LimitedMap<E, T>
            = limit => {
                if (limit === 0) {
                    return map0(is)
                }
                const branchLimit = limit - 1
                const left = main(branchLimit)
                const leftRest = left.rest
                return leftRest === undefined ? left : addRoot(left.map)(leftRest)(branchLimit)
            }
        return main
    }

const noLimit
    : <E, T>(_: LimitedMap<E, T>) => (_: number) => IntervalMap<E, T>
    = ({ map, rest }) => limit => rest === undefined ? map : noLimit(addRoot(map)(rest)(limit))(limit + 1)

export const intervalMap
    : <E, T>(_: intervalSequence.IntervalSequence<E, T>) => IntervalMap<E, T>
    = s => noLimit(map0(s))(0)
