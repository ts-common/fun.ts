// tslint:disable:no-expression-statement
import * as intervalSequence from '../intervalSequence'
import * as intervalMap from '../intervalMap'
import { strategyS, IntervalSequenceS } from './intervalSequenceStrategy'

describe('intervalMap', () => {
    it('one', () => {
        const s: IntervalSequenceS = intervalSequence.fromArray('a')([])
        const result = intervalMap.intervalMap(s)
        expect(result)
            .toStrictEqual({ value: 'a' })
        const x = intervalMap.get(strategyS)(result)(12)
        expect(x)
            .toBe('a')
    })
    it('two', () => {
        const s = intervalSequence.fromArray('a')([{ min: 23, value: 'b' }])
        const result = intervalMap.intervalMap(s)
        expect(result)
            .toStrictEqual({
                left: { value: 'a' },
                rightMin: 23,
                right: { value: 'b'},
            })
        const x0 = intervalMap.get(strategyS)(result)(12)
        expect(x0)
            .toBe('a')
        const x1 = intervalMap.get(strategyS)(result)(23)
        expect(x1)
            .toBe('b')
    })
    it('three', () => {
        const s = intervalSequence.fromArray('a')([{ min: 23, value: 'b' }, { min: 45, value: 'A' }])
        const result = intervalMap.intervalMap(s)
        expect(result)
            .toStrictEqual({
                left: {
                    left: { value: 'a' },
                    rightMin: 23,
                    right: { value: 'b'},
                },
                rightMin: 45,
                right: { value: 'A' },
            })
        const x0 = intervalMap.get(strategyS)(result)(12)
        expect(x0)
            .toBe('a')
        const x1 = intervalMap.get(strategyS)(result)(23)
        expect(x1)
            .toBe('b')
        const x2 = intervalMap.get(strategyS)(result)(123)
        expect(x2)
            .toBe('A')
    })
    it('forth', () => {
        const s = intervalSequence.fromArray('a')([
            { min: 23, value: 'b' },
            { min: 45, value: 'Z' },
            { min: 76, value: 'A' }
        ])
        const result = intervalMap.intervalMap(s)
        expect(result)
            .toStrictEqual({
                left: {
                    left: { value: 'a' },
                    rightMin: 23,
                    right: { value: 'b'},
                },
                rightMin: 45,
                right: {
                    left: { value: 'Z' },
                    rightMin: 76,
                    right: { value: 'A' },
                },
            })
        const x0 = intervalMap.get(strategyS)(result)(12)
        expect(x0)
            .toBe('a')
        const x1 = intervalMap.get(strategyS)(result)(23)
        expect(x1)
            .toBe('b')
        const x2 = intervalMap.get(strategyS)(result)(75)
        expect(x2)
            .toBe('Z')
        const x3 = intervalMap.get(strategyS)(result)(123)
        expect(x3)
            .toBe('A')
    })
    it('five', () => {
        const s = intervalSequence.fromArray('a')([
            { min: 23, value: 'b' },
            { min: 45, value: 'Z' },
            { min: 76, value: 'A' },
            { min: 90, value: 'x' },
        ])
        const result = intervalMap.intervalMap(s)
        expect(result)
            .toStrictEqual({
                left: {
                    left: {
                        left: { value: 'a' },
                        rightMin: 23,
                        right: { value: 'b'},
                    },
                    rightMin: 45,
                    right: {
                        left: { value: 'Z' },
                        rightMin: 76,
                        right: { value: 'A' },
                    },
                },
                rightMin: 90,
                right: { value: 'x' }
            })
        const x0 = intervalMap.get(strategyS)(result)(12)
        expect(x0)
            .toBe('a')
        const x1 = intervalMap.get(strategyS)(result)(23)
        expect(x1)
            .toBe('b')
        const x2 = intervalMap.get(strategyS)(result)(75)
        expect(x2)
            .toBe('Z')
        const x3 = intervalMap.get(strategyS)(result)(89)
        expect(x3)
            .toBe('A')
        const x4 = intervalMap.get(strategyS)(result)(90)
        expect(x4)
            .toBe('x')
    })
})

describe('balanced', () => {
    it('one', () => {
        const s: IntervalSequenceS = intervalSequence.fromArray('a')([])
        const result = intervalMap.balanced(s)
        expect(result)
            .toStrictEqual({ value: 'a' })
        const x = intervalMap.get(strategyS)(result)(12)
        expect(x)
            .toBe('a')
    })
    it('two', () => {
        const s = intervalSequence.fromArray('a')([{ min: 23, value: 'b' }])
        const result = intervalMap.balanced(s)
        expect(result)
            .toStrictEqual({
                left: { value: 'a' },
                rightMin: 23,
                right: { value: 'b'},
            })
        const x0 = intervalMap.get(strategyS)(result)(12)
        expect(x0)
            .toBe('a')
        const x1 = intervalMap.get(strategyS)(result)(23)
        expect(x1)
            .toBe('b')
    })
    it('three', () => {
        const s = intervalSequence.fromArray('a')([{ min: 23, value: 'b' }, { min: 45, value: 'A' }])
        const result = intervalMap.balanced(s)
        expect(result)
            .toStrictEqual({
                left: { value: 'a' },
                rightMin: 23,
                right: {
                    left: { value: 'b'},
                    rightMin: 45,
                    right: { value: 'A' },
                },
            })
        const x0 = intervalMap.get(strategyS)(result)(12)
        expect(x0)
            .toBe('a')
        const x1 = intervalMap.get(strategyS)(result)(23)
        expect(x1)
            .toBe('b')
        const x2 = intervalMap.get(strategyS)(result)(123)
        expect(x2)
            .toBe('A')
    })
    it('forth', () => {
        const s = intervalSequence.fromArray('a')([
            { min: 23, value: 'b' },
            { min: 45, value: 'Z' },
            { min: 76, value: 'A' }
        ])
        const result = intervalMap.balanced(s)
        expect(result)
            .toStrictEqual({
                left: {
                    left: { value: 'a' },
                    rightMin: 23,
                    right: { value: 'b'},
                },
                rightMin: 45,
                right: {
                    left: { value: 'Z' },
                    rightMin: 76,
                    right: { value: 'A' },
                },
            })
        const x0 = intervalMap.get(strategyS)(result)(12)
        expect(x0)
            .toBe('a')
        const x1 = intervalMap.get(strategyS)(result)(23)
        expect(x1)
            .toBe('b')
        const x2 = intervalMap.get(strategyS)(result)(75)
        expect(x2)
            .toBe('Z')
        const x3 = intervalMap.get(strategyS)(result)(123)
        expect(x3)
            .toBe('A')
    })
    it('five', () => {
        const s = intervalSequence.fromArray('a')([
            { min: 23, value: 'b' },
            { min: 45, value: 'Z' },
            { min: 76, value: 'A' },
            { min: 90, value: 'x' },
        ])
        const result = intervalMap.balanced(s)
        expect(result)
            .toStrictEqual({
                left: {
                    left: { value: 'a' },
                    rightMin: 23,
                    right: { value: 'b'},
                },
                rightMin: 45,
                right: {
                    left: { value: 'Z' },
                    rightMin: 76,
                    right: {
                        left: { value: 'A' },
                        rightMin: 90,
                        right: { value: 'x' },
                    },
                },
            })
        const x0 = intervalMap.get(strategyS)(result)(12)
        expect(x0)
            .toBe('a')
        const x1 = intervalMap.get(strategyS)(result)(23)
        expect(x1)
            .toBe('b')
        const x2 = intervalMap.get(strategyS)(result)(75)
        expect(x2)
            .toBe('Z')
        const x3 = intervalMap.get(strategyS)(result)(89)
        expect(x3)
            .toBe('A')
        const x4 = intervalMap.get(strategyS)(result)(90)
        expect(x4)
            .toBe('x')
    })
})
