// tslint:disable:no-expression-statement
import * as intervalSequence from '../intervalSequence'
import * as sequence from '../sequence'
import * as isTestStrat from './intervalSequenceStrategy'

describe('merge', () => {
    it('empty', () => {
        const a: isTestStrat.IntervalSequenceS = { first: 'first', rest: undefined }
        const b: isTestStrat.IntervalSequenceS = { first: 'second', rest: undefined }
        const r =
            intervalSequence.merge
                <number, string, string, string>
                (isTestStrat.strategyS)(isTestStrat.reduceS)(a)(b)

        expect(r)
            .toStrictEqual({ first: 'first.second', rest: undefined })
    })
    it('left', () => {
        const a: isTestStrat.IntervalSequenceS = { first: 'a0', rest: sequence.fromArray([{ edge: 12, value: 'a1'}]) }
        const b: isTestStrat.IntervalSequenceS = { first: 'b0', rest: undefined }
        const r =
            intervalSequence.merge
                <number, string, string, string>
                (isTestStrat.strategyS)(isTestStrat.reduceS)(a)(b)

        expect(r.first)
            .toBe('a0.b0')
        expect(sequence.toArray(r.rest))
            .toStrictEqual([{ edge: 12, value: `a1.b0`}])
    })
    it('right', () => {
        const a: isTestStrat.IntervalSequenceS = { first: 'a0', rest: undefined }
        const b: isTestStrat.IntervalSequenceS = { first: 'b0', rest: sequence.fromArray([{ edge: 12, value: 'b1'}]) }
        const r =
            intervalSequence.merge
                <number, string, string, string>
                (isTestStrat.strategyS)(isTestStrat.reduceS)(a)(b)

        expect(r.first)
            .toBe('a0.b0')
        expect(sequence.toArray(r.rest))
            .toStrictEqual([{ edge: 12, value: `a0.b1`}])
    })
    it('mix', () => {
        const a: isTestStrat.IntervalSequenceS = {
            first: 'a0',
            rest: sequence.fromArray([
                { edge: 0, value: 'a1'},
                { edge: 5, value: `a2` },
                { edge: 12, value: 'a3' },
                { edge: 30, value: 'a4' }
            ])
        }
        const b: isTestStrat.IntervalSequenceS = {
            first: 'b0',
            rest: sequence.fromArray([
                { edge: 12, value: 'b1'},
                { edge: 24, value: 'b2' }
            ])
        }
        const r =
            intervalSequence.merge
                <number, string, string, string>
                (isTestStrat.strategyS)(isTestStrat.reduceS)(a)(b)

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
        const a: isTestStrat.IntervalSequenceyN = {
            first: 0,
            rest: sequence.fromArray([
                { edge: 0, value: 1},
                { edge: 5, value: 2 },
                { edge: 12, value: 3 },
                { edge: 30, value: 4 }
            ])
        }
        const b: isTestStrat.IntervalSequenceyN = {
            first: 0,
            rest: sequence.fromArray([
                { edge: 12, value: 1 },
                { edge: 24, value: 5 }
            ])
        }
        const r =
            intervalSequence.merge
                <number, number, number, number>
                (isTestStrat.strategyN)(isTestStrat.reduceN)(a)(b)

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
        const a: isTestStrat.IntervalSequenceyN = {
            first: 0,
            rest: sequence.fromArray([
                { edge: 0, value: 1}
            ])
        }
        const b: isTestStrat.IntervalSequenceyN = {
            first: 1,
            rest: sequence.fromArray([
                { edge: 0, value: 0 }
            ])
        }
        const r =
            intervalSequence.merge
                <number, number, number, number>
                (isTestStrat.strategyN)(isTestStrat.reduceN)(a)(b)

        expect(r.first)
            .toBe(0)
        expect(r.rest)
            .toBeUndefined()
    })
})

describe('add', () => {
    it('add', () => {
        const a: isTestStrat.IntervalSequenceyN = {
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
        const r =
            intervalSequence.add
                <number, number>
                (isTestStrat.strategyN)(a)(b)
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
        const a: isTestStrat.IntervalSequenceyN = {
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
        const r =
            intervalSequence.add
                <number, number>
                (isTestStrat.strategyN)(a)(b)

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
