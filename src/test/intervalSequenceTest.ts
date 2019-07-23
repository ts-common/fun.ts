// tslint:disable:no-expression-statement
import * as intervalSequence from '../intervalSequence'
import * as sequence from '../sequence'
import { IntervalSequence, strategy, IntervalMapN, strategyN } from './intervalSequenceStrategy'

describe('merge', () => {
    it('empty', () => {
        const a: IntervalSequence = { first: 'first', rest: undefined }
        const b: IntervalSequence = { first: 'second', rest: undefined }
        const r = intervalSequence.merge(strategy)(a)(b)
        expect(r)
            .toStrictEqual({ first: 'first.second', rest: undefined })
    })
    it('left', () => {
        const a: IntervalSequence = { first: 'a0', rest: sequence.fromArray([{ edge: 12, value: 'a1'}]) }
        const b: IntervalSequence = { first: 'b0', rest: undefined }
        const r = intervalSequence.merge(strategy)(a)(b)
        expect(r.first)
            .toBe('a0.b0')
        expect(sequence.toArray(r.rest))
            .toStrictEqual([{ edge: 12, value: `a1.b0`}])
    })
    it('right', () => {
        const a: IntervalSequence = { first: 'a0', rest: undefined }
        const b: IntervalSequence = { first: 'b0', rest: sequence.fromArray([{ edge: 12, value: 'b1'}]) }
        const r = intervalSequence.merge(strategy)(a)(b)
        expect(r.first)
            .toBe('a0.b0')
        expect(sequence.toArray(r.rest))
            .toStrictEqual([{ edge: 12, value: `a0.b1`}])
    })
    it('mix', () => {
        const a: IntervalSequence = {
            first: 'a0',
            rest: sequence.fromArray([
                { edge: 0, value: 'a1'},
                { edge: 5, value: `a2` },
                { edge: 12, value: 'a3' },
                { edge: 30, value: 'a4' }
            ])
        }
        const b: IntervalSequence = {
            first: 'b0',
            rest: sequence.fromArray([
                { edge: 12, value: 'b1'},
                { edge: 24, value: 'b2' }
            ])
        }
        const r = intervalSequence.merge(strategy)(a)(b)
        expect(r.first)
            .toBe('a0.b0')
        expect(sequence.toArray(r.rest))
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
            rest: sequence.fromArray([
                { edge: 0, value: 1},
                { edge: 5, value: 2 },
                { edge: 12, value: 3 },
                { edge: 30, value: 4 }
            ])
        }
        const b: IntervalMapN = {
            first: 0,
            rest: sequence.fromArray([
                { edge: 12, value: 1 },
                { edge: 24, value: 5 }
            ])
        }
        const r = intervalSequence.merge(strategyN)(a)(b)
        expect(r.first)
            .toBe(0)
        expect(sequence.toArray(r.rest))
            .toStrictEqual([
                { edge: 12, value: 1 },
                { edge: 24, value: 3 },
                { edge: 30, value: 4 },
            ])
    })
    it('dedup2', () => {
        const a: IntervalMapN = {
            first: 0,
            rest: sequence.fromArray([
                { edge: 0, value: 1}
            ])
        }
        const b: IntervalMapN = {
            first: 1,
            rest: sequence.fromArray([
                { edge: 0, value: 0 }
            ])
        }
        const r = intervalSequence.merge(strategyN)(a)(b)
        expect(r.first)
            .toBe(0)
        expect(r.rest)
            .toBeUndefined()
    })
})

describe('merge', () => {
    it('add', () => {
        const a: IntervalMapN = {
            first: 0,
            rest: sequence.fromArray([
                { edge: 0, value: 1},
                { edge: 5, value: 2 }
            ])
        }
        const b: intervalSequence.Interval<number, number> = {
            min: 1,
            max: 2,
            value: 15,
        }
        const r = intervalSequence.add(strategyN.intervalSequence)(a)(b)
        expect(r.first)
            .toBe(0)
        expect(sequence.toArray(r.rest))
            .toStrictEqual([
                { edge: 0, value: 1},
                { edge: 1, value: 15},
                { edge: 2, value: 1},
                { edge: 5, value: 2 }
            ])
    })
    it('addEnd', () => {
        const a: IntervalMapN = {
            first: 0,
            rest: sequence.fromArray([
                { edge: 0, value: 1},
                { edge: 5, value: 2 }
            ])
        }
        const b: intervalSequence.Interval<number, number> = {
            min: 6,
            max: 10,
            value: 15,
        }
        const r = intervalSequence.add(strategyN.intervalSequence)(a)(b)
        expect(r.first)
            .toBe(0)
        expect(sequence.toArray(r.rest))
            .toStrictEqual([
                { edge: 0, value: 1},
                { edge: 5, value: 2 },
                { edge: 6, value: 15 },
                { edge: 10, value: 2 }
            ])
    })
})
