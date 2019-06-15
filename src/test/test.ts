// tslint:disable:no-expression-statement
import * as index from '../index'
import * as _ from '@ts-common/iterator'
import { addPosition } from '@ts-common/add-position'

describe('tokenizer', () => {
    it('empty', () => {
        const x = addPosition('')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([{
                position: {
                    column: 1,
                    line: 1
                },
                token: {
                    kind: 'Terminal'
                }
            }])
    })
    it('whiteSpace', () => {
        const x = addPosition(' \t\r\n  ')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([{
                position: {
                    column: 3,
                    line: 2
                },
                token: {
                    kind: 'Terminal'
                }
            }])
    })
    it(`id`, () => {
        const x = addPosition(' \t\r\n id15 ')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 2,
                        line: 2
                    },
                    token: {
                        kind: 'Id'
                    }
                },
                {
                    position: {
                        column: 6,
                        line: 2
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
})
