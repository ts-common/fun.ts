import * as it from '@ts-common/iterator'
import { CharAndPosition, Position, terminal } from './addPosition'
import * as meta from './meta'

type CharSet = (_: string) => boolean

const interval
    : (_: string) => (_: string) => CharSet
    = min => max => c => min <= c && c <= max

const one
    : (_: string) => CharSet
    = v => c => v === c

const union
    : (..._: readonly CharSet[]) => CharSet
    = (...sets) => c => it.some(sets, set => set(c))

const upperCaseLetterSet = interval('A')('Z')

const lowerCaseLetterSet = interval('a')('z')

const digitSet = interval('0')('9')

const eSet = union(one('e'), one('E'))

const letterSet = union(upperCaseLetterSet, lowerCaseLetterSet)

const firstIdLetterSet = union(one('$'), one('_'), letterSet)

const restIdLetterSet = union(firstIdLetterSet, digitSet)

const whiteSpace = union(one(' '), one('\t'), one('\n'), one('\r'))

type Terminal = {
    readonly kind: 'Terminal'
}

type UnknownCharacterError = {
    readonly kind: 'UnknownCharacterError'
    readonly c: string
}

const symbolArray = ['{', '}', ':', ',', '[', ']', '-'] as const

type SymbolType = meta.ArrayItem<typeof symbolArray>

type SymbolToken = {
    readonly kind: 'SymbolToken'
    readonly c: SymbolType
}

const symbolSet
    : (_: string) => SymbolType | undefined
    = c => symbolArray.find(v => v === c)

type Id = {
    readonly kind: 'Id'
    readonly value: string
}

type FloatNumber = {
    readonly kind: 'FloatNumber'
    readonly value: number
}

export type StringToken = {
    readonly kind: 'StringToken'
    readonly value: string
}

export type Token = Terminal | UnknownCharacterError | Id | FloatNumber | SymbolToken | StringToken

export type TokenAndPosition = {
    readonly token: Token
    readonly position: Position
}

type StateResult = readonly [State, it.Iterable<TokenAndPosition>]

type State = (_: CharAndPosition) => StateResult

const createTerminal
    : (_: Position) => StateResult
    = position => [whiteSpaceState, [{ token: { kind: 'Terminal' }, position }]]

export const whiteSpaceState
    : State
    = cp => {
        const { c, position } = cp
        if (c === terminal) {
            return createTerminal(position)
        }
        if (whiteSpace(c)) {
            return [whiteSpaceState, []]
        }
        if (firstIdLetterSet(c)) {
            return [createIdState(position)(c), []]
        }
        if (digitSet(c)) {
            return [createNumberState(position)(c), []]
        }
        const symbol = symbolSet(c)
        if (symbol !== undefined) {
            return [whiteSpaceState, [{ token: { kind: 'SymbolToken', c: symbol }, position }]]
        }
        if (c === '"') {
            return [createStringState(position), []]
        }
        return [whiteSpaceState, [{ token: { kind: 'UnknownCharacterError', c }, position }]]
    }

const continueWhiteSpace
    : (_: TokenAndPosition) => State
    = tp => cp => {
        const [state, result] = whiteSpaceState(cp)
        return [state, it.concat([tp], result)]
    }

const createIdState
    : (_: Position) => (_: string) => State
    = position => {
        const nextState:
            (_: string) => State =
            value => cp => {
                const { c } = cp
                return restIdLetterSet(c)
                    ? [nextState(value + c), []]
                    : continueWhiteSpace({ token: { kind: 'Id', value }, position })(cp)
            }
        return nextState
    }

const charCode
    : (_: string) => number
    = c => c.charCodeAt(0)

const zeroCharCode = charCode('0')

const charToInt
    : (_: string) => number
    = c => charCode(c) - zeroCharCode

const createNumberState
    : (_: Position) => (_: string) => State
    = position => {

        type NumberStates = {
            readonly begin: State
            readonly dot: (_: number) => State
            readonly end: State
        }

        const states
            : (_: number) => NumberStates
            = value => {

                const end
                    : State
                    = continueWhiteSpace({ token: { kind: 'FloatNumber', value }, position })

                const begin
                    : State
                    = cp => {
                        const { c } = cp
                        return digitSet(c) ? [states(value * 10 + charToInt(c)).begin, []]
                            : c === '.' ? [dot(0.1), []]
                            : eSet(c) ? [exp, []]
                            : end(cp)
                    }

                const dot
                    : (_: number) => State
                    = multiplier => cp => {
                        const { c } = cp
                        return digitSet(c) ? [
                                    states(value + charToInt(c) * multiplier)
                                        .dot(multiplier * 0.1),
                                    []
                                ]
                            : eSet(c) ? [exp, []]
                            : end(cp)
                    }

                const exp
                    : State
                    = cp => {
                        const { c } = cp
                        if (c === '-') {
                            return [expSign(false), []]
                        }
                        const plus = expSign(true)
                        return c === '+' ? [plus, []]
                            : digitSet(c) ? plus(cp)
                            : end(cp)
                    }

                const expSign
                    : (_: boolean) => State
                    = positive => {
                        const expState
                            : (_: number) => State
                            = multiplier => cp => {
                                const { c } = cp
                                return digitSet(c)
                                    // Eg.: E+23 = 10 ** 23 = (10 ** 2) ** 10 * 10 ** 3
                                    ? [expState(multiplier ** 10 * 10 ** charToInt(c)), []]
                                    : states(value * (positive ? multiplier : 1 / multiplier))
                                        .end(cp)
                            }
                        return expState(1)
                    }

                return { begin, dot, end }
            }

        return c => states(charToInt(c)).begin
    }

const escapeMap
    : { readonly [i in string]?: string }
    = {
        '"': '"',
        '\\': '\\',
        '/': '/',
        'b': '\b',
        't': '\t',
        'f': '\f',
        'r': '\r',
        'n': '\n',
    }

const hexUpperAOffset = charCode('A') - 10

const hexLowerAOffset = charCode('a') - 10

const hexUppercaseSet = interval('A')('F')

const hexLowercaseSet = interval('a')('f')

const hex
    : (_: string) => number | undefined
    = c => digitSet(c) ? charToInt(c)
        : hexUppercaseSet(c) ? c.charCodeAt(0) - hexUpperAOffset
        : hexLowercaseSet(c) ? c.charCodeAt(0) - hexLowerAOffset
        : undefined

const createStringState
    : (_: Position) => State
    = position => {
        const state
            : (_: string) => State
            = value => {
                const tp
                    : TokenAndPosition
                    = { token: { kind: 'StringToken', value }, position }
                const error
                    : State
                    = continueWhiteSpace(tp)
                const main
                    : State
                    = cp => {
                        const { c } = cp
                        return c === '"' ? [whiteSpaceState, [tp]]
                            : c === terminal || c === '\n' ? error(cp)
                            : c === '\\' ? [escape, []]
                            : [state(value + c), []]
                    }
                const escape
                    : State
                    = cp => {
                        const { c } = cp
                        if (c === 'u') {
                            return [unicodeEscape(0)(0), []]
                        }
                        const result = escapeMap[c]
                        if (result !== undefined) {
                            return [state(`${value}${result}`), []]
                        }
                        // Report an error
                        return state(`${value}\\`)(cp)
                    }
                const unicodeEscape
                    : (_: number) => (_: number) => State
                    = code => i => cp => {
                        const h = hex(cp.c)
                        if (h !== undefined) {
                            const newCode = (code << 4) + h
                            const stateResult = i < 3
                                ? unicodeEscape(newCode)(i + 1)
                                : state(value + String.fromCharCode(newCode))
                            return [stateResult, []]
                        }
                        // Report an error
                        return state(`${value}\\u`)(cp)
                    }
                return main
            }
        return state('')
    }
