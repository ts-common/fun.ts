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
        const reduce
            : (_: number) => (_: number) => number
            = a => b => a + b
        const result = sequence.fold(reduce)(10)(undefined)
        expect(result)
            .toBe(10)
    })
    it('array', () => {
        const reduce
            : (_: number) => (_: number) => number
            = a => b => a + b
        const result = sequence.fold(reduce)(10)(sequence.fromArray([12, 9]))
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
