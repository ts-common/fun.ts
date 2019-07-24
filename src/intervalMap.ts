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
    : (_: number) => <E, T>(_: LimitedMap<E, T>) => IntervalMap<E, T>
    = limit => ({ map, rest }) => rest === undefined ? map : noLimit(limit + 1)(addRoot(map)(rest)(limit))

export const intervalMap
    : <E, T>(_: intervalSequence.IntervalSequence<E, T>) => IntervalMap<E, T>
    = s => noLimit(0)(map0(s))

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
                    = map => map.kind === 'leaf'
                        ? map.value
                        : result(strategy.compare(e)(map.rightMin) === -1 ? map.left : map.right)
                return result
            }
        return map => e => main(e)(map)
    }
