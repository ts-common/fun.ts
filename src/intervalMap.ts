import * as intervalSequence from './intervalSequence'
import * as sequence from './sequence'

export type Node<E, T> = {
    readonly left: IntervalMap<E, T>
    readonly rightMin: E
    readonly right: IntervalMap<E, T>
}

export type Leaf<T> = {
    readonly left?: undefined
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
                left,
                rightMin: rest.first.min,
                right: right.map
            },
            rest: right.rest
        }
    }

const map0
    : <E, T>(_: intervalSequence.IntervalSequence<E, T>) => LimitedMap<E, T>
    = ({ first, rest }) => ({ map: { value: first.value }, rest: rest() })

const limitedMap
    : <E, T>(_: intervalSequence.IntervalSequence<E, T>) => (_: number) => LimitedMap<E, T>
    = s => {
        type Types = typeof s extends intervalSequence.IntervalSequence<infer _E, infer _T> ? readonly [_E, _T] : never
        type E = Types[0]
        type T = Types[1]
        const main
            : (_: number) => LimitedMap<E, T>
            = size => {
                if (size === 1) {
                    return map0(s)
                }
                const leftSize = (size / 2) | 0
                const left = main(leftSize)
                const leftRest = left.rest
                return leftRest === undefined ? left : addRoot(left.map)(leftRest)(size - leftSize)
            }
        return main
    }

const noLimit
    : (_: number) => <E, T>(_: LimitedMap<E, T>) => IntervalMap<E, T>
    = limit => ({ map, rest }) => rest === undefined ? map : noLimit(limit * 2)(addRoot(map)(rest)(limit))

export const intervalMap
    : <E, T>(_: intervalSequence.IntervalSequence<E, T>) => IntervalMap<E, T>
    = s => noLimit(1)(map0(s))

export const get
    : <E, T>(_: intervalSequence.Strategy<E, T>) => (_: IntervalMap<E, T>) => (_: E) => T
    = strategy => {
        type Types = typeof strategy extends intervalSequence.Strategy<infer _E, infer _T> ? readonly [_E, _T] : never
        type E = Types[0]
        type T = Types[1]
        const main
            : (_: E) => (_: IntervalMap<E, T>) => T
            = e => {
                const result
                    : (_: IntervalMap<E, T>) => T
                    = map => map.left === undefined
                        ? map.value
                        : result(strategy.compare(e)(map.rightMin) === -1 ? map.left : map.right)
                return result
            }
        return map => e => main(e)(map)
    }

export const balanced
    : <E, T>(_: intervalSequence.IntervalSequence<E, T>) => IntervalMap<E, T>
    = s => limitedMap(s)(sequence.size(s)).map
