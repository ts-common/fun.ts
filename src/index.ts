import * as _ from '@ts-common/iterator'
import { CharAndPosition, Position } from '@ts-common/add-position'

// string => boolean
type CharSet = (_: string) => boolean

// string => string => CharSet
const interval: (_: string) => (_: string) => CharSet =
    min => max => c => min <= c && c <= max

// string => CharSet
const one: (_: string) => CharSet =
    v => c => v === c

// ...CharSet[] => CharSet
const union = (...sets: readonly CharSet[]): CharSet => c => _.some(sets, set => set(c))

const upperCaseLetterSet = interval('A')('B')

const lowerCaseLetterSet = interval('a')('b')

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

type ArrayItem<T> = T extends readonly (infer U)[] ? U : never

type SymbolType = ArrayItem<typeof symbolArray>

type SymbolToken = {
    readonly kind: 'SymbolToken'
    readonly c: SymbolType
}

// string => SymbolType | undefined
const symbolSet: (_: string) => SymbolType | undefined =
    c => symbolArray.find(v => v === c)

type Id = {
    readonly kind: 'Id'
    readonly value: string
}

type FloatNumber = {
    readonly kind: 'FloatNumber'
    readonly value: number
}

type String = {
    readonly kind: 'String'
    readonly value: string
}

type Token = Terminal | UnknownCharacterError | Id | FloatNumber | SymbolToken | String

type TokenAndPosition = {
    readonly token: Token
    readonly position: Position
}

type StateResult = readonly [State, _.Iterable<TokenAndPosition>]

type State = (_: CharAndPosition) => StateResult

// Position => StateResult
const createTerminal: (_: Position) => StateResult =
    position => [whiteSpaceState, [{ token: { kind: 'Terminal' }, position }]]

// State
const whiteSpaceState: State =
    cp => {
        const { c, position } = cp
        if (c === null) {
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

// TokenAndPosition => State
const continueWhiteSpace: (_: TokenAndPosition) => State =
    tp => cp => {
        const [state, result] = whiteSpaceState(cp)
        return [state, _.concat([tp], result)]
    }

// Position => string => State
const createIdState: (_: Position) => (_: string) => State =
    position => {
        // string => State
        const nextState: (value: string) => State =
            value => cp => {
                const { c } = cp
                return c !== null && restIdLetterSet(c)
                    ? [nextState(value + c), []]
                    : continueWhiteSpace({ token: { kind: 'Id', value }, position })(cp)
            }
        return nextState
    }

const zeroCharCode = '0'.charCodeAt(0)

// string => number
const charToInt: (_: string) => number =
    c => c.charCodeAt(0) - zeroCharCode

// Position => string => State
const createNumberState: (_: Position) => (_: string) => State =
    position => {

        // number => State
        const end: (_: number) => State =
            value => continueWhiteSpace({ token: { kind: 'FloatNumber', value }, position })

        // number => State
        const begin: (_: number) => State =
            value => cp => {
                const { c } = cp
                if (c !== null) {
                    if (digitSet(c)) {
                        return [begin(value * 10 + charToInt(c)), []]
                    }
                    if (c === '.') {
                        return [afterDot(value)(0.1), []]
                    }
                    if (eSet(c)) {
                        return [afterE(value), []]
                    }
                }
                return end(value)(cp)
            }

        // number => number => State
        const afterDot: (_: number) => (_: number) => State =
            value => multiplier => cp => {
                const { c } = cp
                if (c !== null) {
                    if (digitSet(c)) {
                        return [afterDot(value + charToInt(c) * multiplier)(multiplier * 0.1), []]
                    }
                    if (eSet(c)) {
                        return [afterE(value), []]
                    }
                }
                return end(value)(cp)
            }

        // number => State
        const afterE: (_: number) => State =
            value => cp => {
                const { c } = cp
                if (c !== null) {
                    if (c === '-') {
                        return [afterESign(value)(false), []]
                    }
                    const plus = afterESign(value)(true)
                    if (c === '+') {
                        return [plus, []]
                    }
                    if (digitSet(c)) {
                        return plus(cp)
                    }
                }
                return end(value)(cp)
            }

        // number => boolean => State
        const afterESign: (_: number) => (_: boolean) => State =
            value => positive => {
                // number => State
                const multiplierState: (_: number) => State =
                    multiplier => cp => {
                        const { c } = cp
                        if (c !== null && digitSet(c)) {
                            // eg.: E+23 = 10 ** 23 = (10 ** 2) ** 10 * 10 ** 3
                            return [multiplierState(multiplier ** 10 * 10 ** charToInt(c)), []]
                        }
                        return end(value * (positive ? multiplier : 1 / multiplier))(cp)
                    }
                return multiplierState(1)
            }

        return c => begin(charToInt(c))
    }

// Position => State
const createStringState: (_: Position) => State =
    position => {
        // string => State
        const state: (_: string) => State =
            value => cp => {
                const { c } = cp
                if (c === null || c === '\n' || c === '"') {
                    return continueWhiteSpace({ token: { kind: 'String', value }, position })(cp)
                }
                return [state(value + c), []]
            }
        return state('')
    }