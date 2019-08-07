// tslint:disable:no-expression-statement
import * as intervalSequence from '../intervalSequence'
import * as sequence from '../sequence'
import { IntervalSequenceS, mergeS, IntervalSequenceN, mergeN, strategyN } from './intervalSequenceStrategy'
import * as equal from '../equal'

describe('merge', () => {
    it('empty', () => {
        const a: IntervalSequenceS = intervalSequence.fromArray('first')([])
        const b: IntervalSequenceS = intervalSequence.fromArray('second')([])
        const r = mergeS(a)(b)
        expect(r.first)
            .toStrictEqual({ value: 'first.second' })
        expect(sequence.toArray(r.rest()))
            .toStrictEqual([])
    })
    it('left', () => {
        const a: IntervalSequenceS = intervalSequence.fromArray('a0')([{ min: 12, value: 'a1'}])
        const b: IntervalSequenceS = intervalSequence.fromArray('b0')([])
        const r = mergeS(a)(b)
        expect(r.first)
            .toStrictEqual({ value: 'a0.b0' })
        expect(sequence.toArray(r.rest()))
            .toStrictEqual([{ min: 12, value: `a1.b0`}])
    })
    it('right', () => {
        const a: IntervalSequenceS = intervalSequence.fromArray('a0')([])
        const b: IntervalSequenceS = intervalSequence.fromArray('b0')([{ min: 12, value: 'b1'}])
        const r = mergeS(a)(b)
        expect(r.first)
            .toStrictEqual({ value: 'a0.b0' })
        expect(sequence.toArray(r.rest()))
            .toStrictEqual([{ min: 12, value: `a0.b1`}])
    })
    it('mix', () => {
        const a: IntervalSequenceS = intervalSequence.fromArray('a0')([
            { min: 0, value: 'a1'},
            { min: 5, value: `a2` },
            { min: 12, value: 'a3' },
            { min: 30, value: 'a4' }
        ])
        const b: IntervalSequenceS = intervalSequence.fromArray('b0')([
            { min: 12, value: 'b1'},
            { min: 24, value: 'b2' }
        ])
        const r = mergeS(a)(b)
        expect(r.first)
            .toStrictEqual({ value: 'a0.b0' })
        expect(sequence.toArray(r.rest()))
            .toStrictEqual([
                { min: 0, value: 'a1.b0' },
                { min: 5, value: 'a2.b0' },
                { min: 12, value: 'a3.b1' },
                { min: 24, value: 'a3.b2' },
                { min: 30, value: 'a4.b2' }
            ])
    })
    it('dedup', () => {
        const a: IntervalSequenceN = intervalSequence.fromArray(0)([
            { min: 0, value: 1},
            { min: 5, value: 2 },
            { min: 12, value: 3 },
            { min: 30, value: 4 }
        ])
        const b: IntervalSequenceN = intervalSequence.fromArray(0)([
            { min: 12, value: 1 },
            { min: 24, value: 5 }
        ])
        const r = mergeN(a)(b)
        expect(r.first.value)
            .toBe(0)
        expect(sequence.toArray(r.rest()))
            .toStrictEqual([
                { min: 12, value: 1 },
                { min: 24, value: 3 },
                { min: 30, value: 4 },
            ])
    })
    it('dedup2', () => {
        const a: IntervalSequenceN = intervalSequence.fromArray(0)([
            { min: 0, value: 1}
        ])
        const b: IntervalSequenceN = intervalSequence.fromArray(1)([
            { min: 0, value: 0 }
        ])
        const r = mergeN(a)(b)
        expect(r.first.value)
            .toBe(0)
        expect(r.rest())
            .toBeUndefined()
    })
})

describe('add', () => {
    it('add', () => {
        const a: IntervalSequenceN = intervalSequence.fromArray(0)([
                { min: 0, value: 1},
                { min: 5, value: 2 }
            ])
        const b: intervalSequence.Interval<number, number> = {
            min: 1,
            excludedMax: 2,
            value: 15,
        }
        const r = intervalSequence.add(strategyN)(a)(b)
        expect(r.first.value)
            .toBe(0)
        expect(sequence.toArray(r.rest()))
            .toStrictEqual([
                { min: 0, value: 1},
                { min: 1, value: 15},
                { min: 2, value: 1},
                { min: 5, value: 2 }
            ])
    })
    it('addEnd', () => {
        const a: IntervalSequenceN = intervalSequence.fromArray(0)([
            { min: 0, value: 1},
            { min: 5, value: 2 }
        ])
        const b: intervalSequence.Interval<number, number> = {
            min: 6,
            excludedMax: 10,
            value: 15,
        }
        const r = intervalSequence.add(strategyN)(a)(b)

        expect(r.first.value)
            .toBe(0)
        expect(sequence.toArray(r.rest()))
            .toStrictEqual([
                { min: 0, value: 1},
                { min: 5, value: 2 },
                { min: 6, value: 15 },
                { min: 10, value: 2 }
            ])
    })
})

describe('map', () => {
    describe('empty', () => {
        const i = intervalSequence.fromArray('Hello')([])
        const f
            : (_: string) => number
            = v => v.length
        const result = intervalSequence.map(equal.strictEqual)(f)(i)
        expect(result.first.value)
            .toBe(5)
        expect(result.rest())
            .toBeUndefined()
    })
    describe('map', () => {
        const i = intervalSequence.fromArray('Hello')([{ min: 3, value: 'A'}])
        const f
            : (_: string) => number
            = v => v.length
        const result = intervalSequence.map(equal.strictEqual)(f)(i)
        expect(result.first.value)
            .toBe(5)
        expect(sequence.toArray(result.rest()))
            .toStrictEqual([{ min: 3, value: 1 }])
    })
    describe('dedup', () => {
        const i = intervalSequence.fromArray('Hello')([{ min: 3, value: 'Hex12'}, { min: 4, value: 'Oct34' }])
        const f
            : (_: string) => number
            = v => v.length
        const result = intervalSequence.map(equal.strictEqual)(f)(i)
        expect(result.first.value)
            .toBe(5)
        expect(result.rest())
            .toBeUndefined()
    })
})
