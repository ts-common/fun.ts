// tslint:disable:no-expression-statement
import * as intervalSequence from '../intervalSequence'
import * as intervalMap from '../intervalMap'
import { strategyS, IntervalSequenceS } from './intervalSequenceStrategy'

describe('intervalMap', () => {
    it('one', () => {
        const s: IntervalSequenceS = intervalSequence.fromArray('a')([])
        const result = intervalMap.intervalMap(s)
        expect(result)
            .toStrictEqual({ kind: 'leaf', value: 'a' })
        const x = intervalMap.get(strategyS)(result)(12)
        expect(x)
            .toBe('a')
    })
    it('two', () => {
        const s = intervalSequence.fromArray('a')([{ min: 23, value: 'b' }])
        const result = intervalMap.intervalMap(s)
        expect(result)
            .toStrictEqual({
                kind: 'node',
                left: { kind: 'leaf', value: 'a' },
                rightMin: 23,
                right: { kind: 'leaf', value: 'b'},
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
                kind: 'node',
                left: {
                    kind: 'node',
                    left: { kind: 'leaf', value: 'a' },
                    rightMin: 23,
                    right: { kind: 'leaf', value: 'b'},
                },
                rightMin: 45,
                right: { kind: 'leaf', value: 'A' },
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
                kind: 'node',
                left: {
                    kind: 'node',
                    left: { kind: 'leaf', value: 'a' },
                    rightMin: 23,
                    right: { kind: 'leaf', value: 'b'},
                },
                rightMin: 45,
                right: {
                    kind: 'node',
                    left: { kind: 'leaf', value: 'Z' },
                    rightMin: 76,
                    right: { kind: 'leaf', value: 'A' },
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
                kind: 'node',
                left: {
                    kind: 'node',
                    left: {
                        kind: 'node',
                        left: { kind: 'leaf', value: 'a' },
                        rightMin: 23,
                        right: { kind: 'leaf', value: 'b'},
                    },
                    rightMin: 45,
                    right: {
                        kind: 'node',
                        left: { kind: 'leaf', value: 'Z' },
                        rightMin: 76,
                        right: { kind: 'leaf', value: 'A' },
                    },
                },
                rightMin: 90,
                right: { kind: 'leaf', value: 'x' }
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
