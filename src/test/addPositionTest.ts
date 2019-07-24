// tslint:disable:no-expression-statement no-throw
import * as sequence from '../sequence'
import { addPosition } from '../addPosition'

describe('addPosition', () => {
    it('h', () => {
        const result = sequence.toArray(addPosition(sequence.fromArray(['h'])))
        expect(result)
            .toEqual([{ c: 'h', position: { line: 1, column: 1 }}])
    })
    it('h\\nw', () => {
        const result = sequence.toArray(addPosition(sequence.fromArray(['h', '\n', 'w'])))
        expect(result)
            .toEqual([
                { c: 'h', position: { line: 1, column: 1 }},
                { c: '\n', position: { line: 1, column: 2 }},
                { c: 'w', position: { line: 2, column: 1 }}
            ])
    })
    it('json', () => {
        const result = sequence.toArray(addPosition(sequence.fromArray([...'  { \'x\': 2\n }  '])))

        expect(result)
            .toEqual([
                { c: ' ', position: { line: 1, column: 1 }},
                { c: ' ', position: { line: 1, column: 2 }},
                { c: '{', position: { line: 1, column: 3 }},
                { c: ' ', position: { line: 1, column: 4 }},
                { c: '\'', position: { line: 1, column: 5 }},
                { c: 'x', position: { line: 1, column: 6 }},
                { c: '\'', position: { line: 1, column: 7 }},
                { c: ':', position: { line: 1, column: 8 }},
                { c: ' ', position: { line: 1, column: 9 }},
                { c: '2', position: { line: 1, column: 10 }},
                { c: '\n', position: { line: 1, column: 11 }},
                { c: ' ', position: { line: 2, column: 1 }},
                { c: '}', position: { line: 2, column: 2 }},
                { c: ' ', position: { line: 2, column: 3 }},
                { c: ' ', position: { line: 2, column: 4 }}
            ])
    })
    it('eof', () => {
        expect('' < '\u0000')
            .toBe(true)
    })
})
