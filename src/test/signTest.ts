// tslint:disable:no-expression-statement no-throw
import * as sign from '../sign'

describe('numberCompare', () => {
    it('5 >= 0', () => {
        expect(sign.numberCompare(5)(0) >= 0)
            .toBe(true)
    })
})
