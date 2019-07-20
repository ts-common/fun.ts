// tslint:disable:no-expression-statement
import * as intervalMap from '../intervalMap'
import * as sequence from '../sequence'

type IntervalMap = intervalMap.IntervalMap<number, string>

type MergeStrategy = intervalMap.MergeStrategy<number, string, string, string>

const strategy
    : MergeStrategy
    = {
        sign: a => b => a === b ? 0 : a < b ? -1 : 1,
        reduce: a => b => `${a}.${b}`,
        equal: a => b => a === b
    }

type IntervalMapN = intervalMap.IntervalMap<number, number>

type MergeStrategyN = intervalMap.MergeStrategy<number, number, number, number>

const strategyN
    : MergeStrategyN
    = {
        sign: a => b => a === b ? 0 : a < b ? -1 : 1,
        reduce: a => b => a < b ? a : b,
        equal: a => b => a === b
    }

describe('merge', () => {
    it('empty', () => {
        const a: IntervalMap = { first: 'first' }
        const b: IntervalMap = { first: 'second' }
        const r = intervalMap.merge(strategy)(a)(b)
        expect(r)
            .toStrictEqual({ first: 'first.second', list: undefined })
    })
    it('left', () => {
        const a: IntervalMap = { first: 'a0', list: sequence.fromArray([{ edge: 12, value: 'a1'}]) }
        const b: IntervalMap = { first: 'b0' }
        const r = intervalMap.merge(strategy)(a)(b)
        expect(r.first)
            .toBe('a0.b0')
        expect(sequence.toArray(r.list))
            .toStrictEqual([{ edge: 12, value: `a1.b0`}])
    })
    it('right', () => {
        const a: IntervalMap = { first: 'a0' }
        const b: IntervalMap = { first: 'b0', list: sequence.fromArray([{ edge: 12, value: 'b1'}]) }
        const r = intervalMap.merge(strategy)(a)(b)
        expect(r.first)
            .toBe('a0.b0')
        expect(sequence.toArray(r.list))
            .toStrictEqual([{ edge: 12, value: `a0.b1`}])
    })
    it('mix', () => {
        const a: IntervalMap = {
            first: 'a0',
            list: sequence.fromArray([
                { edge: 0, value: 'a1'},
                { edge: 5, value: `a2` },
                { edge: 12, value: 'a3' },
                { edge: 30, value: 'a4' }
            ])
        }
        const b: IntervalMap = {
            first: 'b0',
            list: sequence.fromArray([
                { edge: 12, value: 'b1'},
                { edge: 24, value: 'b2' }
            ])
        }
        const r = intervalMap.merge(strategy)(a)(b)
        expect(r.first)
            .toBe('a0.b0')
        expect(sequence.toArray(r.list))
            .toStrictEqual([
                { edge: 0, value: 'a1.b0' },
                { edge: 5, value: 'a2.b0' },
                { edge: 12, value: 'a3.b1' },
                { edge: 24, value: 'a3.b2' },
                { edge: 30, value: 'a4.b2' }
            ])
    })
    it('dedup', () => {
        const a: IntervalMapN = {
            first: 0,
            list: sequence.fromArray([
                { edge: 0, value: 1},
                { edge: 5, value: 2 },
                { edge: 12, value: 3 },
                { edge: 30, value: 4 }
            ])
        }
        const b: IntervalMapN = {
            first: 0,
            list: sequence.fromArray([
                { edge: 12, value: 1 },
                { edge: 24, value: 5 }
            ])
        }
        const r = intervalMap.merge(strategyN)(a)(b)
        expect(r.first)
            .toBe(0)
        expect(sequence.toArray(r.list))
            .toStrictEqual([
                { edge: 0, value: 0 },
                { edge: 12, value: 1 },
                { edge: 24, value: 3 },
                { edge: 30, value: 4 },
            ])
    })
})
