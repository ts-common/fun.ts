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

// Number of comparisons
//  # of intervals | # of comparisons                       | optimal # of comparisons                |diff|
// ----------------|----------------------------------------|-----------------------------------------|----|
//               1 |  0                                     |  0                                      |    |
//               2 |  2                                     |  2                                      |    |
//               3 |  3 + f( 2) + f( 1) = 5                 |  3 + f(2) + f(1) =  5                   |    |
//               4 |  4 + f( 2) + f( 2) = 8                 |  4 + f(2) + f(2) =  8                   |    |
//               5 |  5 + f( 4) + f( 1) = 13                |  5 + f(3) + f(2) =  5 +  5 +  2 = 12    |1   |
//               6 |  6 + f( 4) + f( 2) =  6 +  8 +  2 = 16 |  6 + f(3) + f(3) =  6 +  5 +  5 = 16    |    |
//               7 |  7 + f( 4) + f( 3) =  7 +  8 +  5 = 20 |  7 + f(4) + f(3) =  7 +  8 +  5 = 20    |    |
//               8 |  8 + f( 4) + f( 4) =  8 +  8 +  8 = 24 |  8 + f(4) + f(4) =  8 +  8 +  8 = 24    |    |
//               9 |  9 + f( 8) + f( 1) =  9 + 24 +  0 = 33 |  9 + f(5) + f(4) =  9 + 12 +  8 = 29    |4   |
//              10 | 10 + f( 8) + f( 2) = 10 + 24 +  2 = 36 | 10 + f(5) + f(5) = 10 + 12 + 12 = 34    |2   |
//              11 | 11 + f( 8) + f( 3) = 11 + 24 +  5 = 40 | 11 + f(6) + f(5) = 11 + 16 + 12 = 37    |3   |
//              12 | 12 + f( 8) + f( 4) = 12 + 24 +  8 = 44 | 12 + f(6) + f(6) = 12 + 16 + 16 = 42    |2   |
//              13 | 13 + f( 8) + f( 5) = 13 + 24 + 13 = 50 | 13 + f(7) + f(6) = 13 + 20 + 16 = 49    |1   |
//              14 | 14 + f( 8) + f( 6) = 14 + 24 + 16 = 54 | 14 + f(7) + f(7) = 14 + 20 + 20 = 54    |    |
//              15 | 15 + f( 8) + f( 7) = 15 + 24 + 20 = 59 | 15 + f(8) + f(7) = 15 + 24 + 20 = 59    |    |
//              16 | 16 + f( 8) + f( 8) = 16 + 24 + 24 = 64 | 64                                      |    |
//              17 | 17 + f(16) + f( 1) = 17 + 64 +  0 = 81 | 17 + f(9) + f(8) = 17 + 29 + 24 = 70    |11  |
//              18 | 18 + f(16) + f( 2) = 18 + 64 +  2 = 84 | 18 + f(9) + f(9) = 18 + 29 + 29 = 76    |8   |
//                 |                                        |                                         |    |
//              32 | 32 + f(16) + f(16) = 32 + 64 + 64 = 160| 160                                     |    |
//              33 | 33 + f(32) + f(1)  = 33 + 160 + 0 = 193| 33 + f(17) + f(16) = 33 + 70 + 64 = 167 |26  |
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
