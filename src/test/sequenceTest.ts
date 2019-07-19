// tslint:disable:no-expression-statement no-throw
import * as sequence from '../sequence'

describe('fromArray', () => {
    it('empty', () => {
        const result = sequence.fromArray([])
        expect(result)
            .toBeUndefined()
    })
    it('2', () => {
        const result = sequence.fromArray([45, 89])
        if (result === undefined) {
            throw new Error('')
        }
        expect(result.value)
            .toBe(45)
        const result2 = result.next()
        if (result2 === undefined) {
            throw new Error('')
        }
        expect(result2.value)
            .toBe(89)
    })
})

describe('fold', () => {
    it('empty', () => {
        const plus
            : (_: number) => (_: number) => number
            = a => b => a + b
        const result = sequence.fold(sequence.accumulator(plus)(10))(undefined)
        expect(result)
            .toBe(10)
    })
    it('array', () => {
        const reduce
            : (_: number) => (_: number) => number
            = a => b => a + b
        const result = sequence.fold(sequence.accumulator(reduce)(10))(sequence.fromArray([12, 9]))
        expect(result)
            .toBe(31)
    })
})

describe('toArray', () => {
    it('empty', () => {
        const result = sequence.toArray(undefined)
        expect(result)
            .toStrictEqual([])
    })
    it('array', () => {
        const result = sequence.toArray(sequence.fromArray([67, 94, 999]))
        expect(result)
            .toStrictEqual([67, 94, 999])
    })
})

describe('reverse', () => {
    it('empty', () => {
        const result = sequence.reverse(undefined)
        expect(result)
            .toBeUndefined()
    })
    it('several', () => {
        const result = sequence.toArray(sequence.reverse(sequence.fromArray([1, 2, 3])))
        expect(result)
            .toStrictEqual([3, 2, 1])
    })
})

describe('concat', () => {
    it('empty left', () => {
        const result = sequence.toArray(sequence.concat(sequence.fromArray([1, 2, 3]))(undefined))
        expect(result)
            .toStrictEqual([1, 2, 3])
    })
    it('empty right', () => {
        const result = sequence.toArray(sequence.concat(undefined)(sequence.fromArray([7, 8, 9])))
        expect(result)
            .toStrictEqual([7, 8, 9])
    })
    it('non-empty', () => {
        const result = sequence.toArray(sequence.concat(sequence.fromArray([1, 2, 3]))(sequence.fromArray([7, 8, 9])))
        expect(result)
            .toStrictEqual([1, 2, 3, 7, 8, 9])
    })
})

describe('flatten', () => {
    it('empty', () => {
        const result = sequence.flatten(undefined)
        expect(result)
            .toBeUndefined()
    })
    it('empty items', () => {
        const result = sequence.flatten(sequence.fromArray([undefined, undefined]))
        expect(result)
            .toBeUndefined()
    })
    it('some', () => {
        const result = sequence.toArray(sequence.flatten<number>(sequence.fromArray([
            sequence.fromArray([1, 2]),
            sequence.fromArray([5, 7, 9]),
        ])))
        expect(result)
            .toStrictEqual([1, 2, 5, 7, 9])
    })
    it('infinite', () => {
        const result = sequence.toArray(sequence.take
            (5)
            (sequence.flatten(sequence.map(_ => sequence.fromArray([2, 3]))(sequence.infinite)))
        )
        expect(result)
            .toStrictEqual([2, 3, 2, 3, 2])
    })
})

describe('map', () => {
    it('non-empty', () => {
        const f
            : (_: number) => string
            = v => `_${v}_`
        const result = sequence.toArray(sequence.map(f)(sequence.fromArray([1, 2, 3])))
        expect(result)
            .toStrictEqual(['_1_', '_2_', '_3_'])
    })
})

describe('entries', () => {
    it('empty', () => {
        const result = sequence.entries(undefined)
        expect(result)
            .toBeUndefined()
    })
    it('non-empty', () => {
        const result = sequence.toArray(sequence.entries(sequence.fromArray(['a', 'b', 'c'])))
        expect(result)
            .toStrictEqual([[0, 'a'], [1, 'b'], [2, 'c']])
    })
})
