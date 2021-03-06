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
    it('whiteSpace', () => {
        const x = addPosition('#')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 1,
                        line: 1
                    },
                    token: {
                        kind: 'UnknownCharacterError',
                        c: '#'
                    }
                },
                {
                    position: {
                        column: 2,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('symbol', () => {
        const x = addPosition(' {  ')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 2,
                        line: 1
                    },
                    token: {
                        kind: 'SymbolToken',
                        c: '{'
                    }
                },
                {
                    position: {
                        column: 5,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
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
                        kind: 'Id',
                        value: 'id15'
                    }
                },
                {
                    position: {
                        column: 7,
                        line: 2
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('number', () => {
        const x = addPosition(' 15 ')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 2,
                        line: 1
                    },
                    token: {
                        kind: 'FloatNumber',
                        value: 15
                    }
                },
                {
                    position: {
                        column: 5,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('number and terminal', () => {
        const x = addPosition('1234567')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 1,
                        line: 1
                    },
                    token: {
                        kind: 'FloatNumber',
                        value: 1234567
                    }
                },
                {
                    position: {
                        column: 8,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('number with dot and terminal', () => {
        const x = addPosition('1234567.9')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 1,
                        line: 1
                    },
                    token: {
                        kind: 'FloatNumber',
                        value: 1234567.9
                    }
                },
                {
                    position: {
                        column: 10,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('number with dot', () => {
        const x = addPosition(' 15.67 ')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 2,
                        line: 1
                    },
                    token: {
                        kind: 'FloatNumber',
                        value: 15.67
                    }
                },
                {
                    position: {
                        column: 8,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('number with e plus', () => {
        const x = addPosition('15e+10 ')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 1,
                        line: 1
                    },
                    token: {
                        kind: 'FloatNumber',
                        value: 15e10
                    }
                },
                {
                    position: {
                        column: 8,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('number with e and terminal', () => {
        const x = addPosition('15e')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 1,
                        line: 1
                    },
                    token: {
                        kind: 'FloatNumber',
                        value: 15
                    }
                },
                {
                    position: {
                        column: 4,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('number with e and something', () => {
        const x = addPosition('15eX')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 1,
                        line: 1
                    },
                    token: {
                        kind: 'FloatNumber',
                        value: 15
                    }
                },
                {
                    position: {
                        column: 4,
                        line: 1
                    },
                    token: {
                        kind: 'Id',
                        value: 'X'
                    }
                },
                {
                    position: {
                        column: 5,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('number with dot and e', () => {
        const x = addPosition(' 15.67e-3 ')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 2,
                        line: 1
                    },
                    token: {
                        kind: 'FloatNumber',
                        value: 0.01567
                    }
                },
                {
                    position: {
                        column: 11,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('number with e', () => {
        const x = addPosition(' 15e3 ')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 2,
                        line: 1
                    },
                    token: {
                        kind: 'FloatNumber',
                        value: 15000
                    }
                },
                {
                    position: {
                        column: 7,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('string', () => {
        const x = addPosition(' "abc" ')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 2,
                        line: 1
                    },
                    token: {
                        kind: 'StringToken',
                        value: 'abc'
                    }
                },
                {
                    position: {
                        column: 8,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('stringEscape', () => {
        const x = addPosition(' "abc\\t\\n" ')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 2,
                        line: 1
                    },
                    token: {
                        kind: 'StringToken',
                        value: 'abc\t\n'
                    }
                },
                {
                    position: {
                        column: 12,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('stringUnicode', () => {
        const x = addPosition(' "abc\\u0020x" ')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 2,
                        line: 1
                    },
                    token: {
                        kind: 'StringToken',
                        value: 'abc x'
                    }
                },
                {
                    position: {
                        column: 15,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('stringUnicode with hex letters', () => {
        const x = addPosition(' "abc\\u01aBx" ')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 2,
                        line: 1
                    },
                    token: {
                        kind: 'StringToken',
                        value: 'abc\u01aBx'
                    }
                },
                {
                    position: {
                        column: 15,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('stringUnicode break', () => {
        const x = addPosition(' "abc\\uA2" ')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 2,
                        line: 1
                    },
                    token: {
                        kind: 'StringToken',
                        value: 'abc\\u'
                    }
                },
                {
                    position: {
                        column: 12,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('stringUnicode terminal', () => {
        const x = addPosition(' "abc\\uA2')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 2,
                        line: 1
                    },
                    token: {
                        kind: 'StringToken',
                        value: 'abc\\u'
                    }
                },
                {
                    position: {
                        column: 10,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('string break', () => {
        const x = addPosition(' "abc')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 2,
                        line: 1
                    },
                    token: {
                        kind: 'StringToken',
                        value: 'abc'
                    }
                },
                {
                    position: {
                        column: 6,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('string escape break', () => {
        const x = addPosition(' "abc\\')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 2,
                        line: 1
                    },
                    token: {
                        kind: 'StringToken',
                        value: 'abc\\'
                    }
                },
                {
                    position: {
                        column: 7,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
    it('string unknown escape', () => {
        const x = addPosition(' "abc\\w')
        const r = x
            .flatScan((s, c) => s(c), index.whiteSpaceState)
            .toArray()
        expect(r)
            .toEqual([
                {
                    position: {
                        column: 2,
                        line: 1
                    },
                    token: {
                        kind: 'StringToken',
                        value: 'abc\\w'
                    }
                },
                {
                    position: {
                        column: 8,
                        line: 1
                    },
                    token: {
                        kind: 'Terminal'
                    }
                }
            ])
    })
})
