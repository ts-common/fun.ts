// tslint:disable:no-expression-statement
import * as intervalSequence from '../intervalSequence'
import * as intervalMap from '../intervalMap'

describe('intervalMap', () => {
    it('one', () => {
        const s = intervalSequence.fromArray('a')([])
        const result = intervalMap.intervalMap(s)
        expect(result)
            .toStrictEqual({ kind: 'leaf', value: 'a' })
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
    })
})
