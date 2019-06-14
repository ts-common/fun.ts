import * as _ from "@ts-common/iterator"
import { CharAndPosition, Position } from "@ts-common/add-position"

type CharSet = (c: string) => boolean

const interval = (min: string, max: string): CharSet => (c: string | null) => c !== null && min <= c && c <= max

const one = (v: string): CharSet => (c: string) => v === c

const union = (...sets: readonly CharSet[]): CharSet => (c: string) => _.some(sets, set => set(c))

const upperCaseLetterSet = interval('A', 'B')

const lowerCaseLetterSet = interval('a', 'b')

const digitSet = interval('0', '9')

const eSet = union(one('e'), one('E'))

const letterSet = union(upperCaseLetterSet, lowerCaseLetterSet)

const firstIdLetterSet = union(one('$'), one('_'), letterSet)

const restIdLetterSet = union(firstIdLetterSet, digitSet)

const whiteSpace = union(one(' '), one('\t'), one('\n'), one('\r'))

type Terminal = {
    readonly kind: "Terminal"
}

type UnknownCharacterError = {
    readonly kind: "UnknownCharacterError"
    readonly c: string
}

const symbolArray = ["{", "}", ":", ",", "[", "]", "-"] as const

type ArrayItem<T> = T extends readonly (infer U)[] ? U : never

type SymbolType = ArrayItem<typeof symbolArray>

type Symbol = {
    readonly kind: "Symbol"
    readonly c: SymbolType
}

const symbolSet = (c: string): c is SymbolType => symbolArray.some(v => v === c)

type Id = {
    readonly kind: "Id"
    readonly value: string
}

type Number = {
    readonly kind: "Number"
    readonly value: number
}

type Token = Terminal | UnknownCharacterError | Id | Number | Symbol

type TokenAndPosition = {
    readonly token: Token
    readonly position: Position
}

type StateResult = readonly [State, _.Iterable<TokenAndPosition>]

type State = (c: CharAndPosition) => StateResult

const createTerminal = (position: Position): StateResult => [whiteSpaceState, [{ token: { kind: "Terminal" }, position }]]

const whiteSpaceState: State = ({c, position}) =>
    c === null
        ? createTerminal(position)
    : whiteSpace(c)
        ? [whiteSpaceState, []]
    : firstIdLetterSet(c)
        ? [createIdState(position)(c), []]
    : digitSet(c)
        ? [createNumberState(position)(c), []]
    : symbolSet(c)
        ? [whiteSpaceState, [{ token: { kind: "Symbol", c }, position }]]
        : [whiteSpaceState, [{ token: { kind: "UnknownCharacterError", c }, position }]]

const continueWhiteSpace = (tp: TokenAndPosition, cp: CharAndPosition): StateResult => {
    const [state, result] = whiteSpaceState(cp)
    return [state, _.concat([tp], result)]
}

const createIdState = (position: Position) => {
    const nextState = (value: string): State => cp => {
        const c = cp.c
        if (c !== null && restIdLetterSet(c)) {
            return [nextState(value + c), []]
        }
        return continueWhiteSpace({ token: { kind: "Id", value }, position }, cp)
    }
    return nextState
}

const ZeroCharCode = '0'.charCodeAt(0)

const charToInt = (c: string) => c.charCodeAt(0) - ZeroCharCode

const createNumberState = (position: Position) => {

    const beforeDot = (value: number): State => cp => {
        const c = cp.c
        if (c !== null) {
            if (digitSet(c)) {
                return [beforeDot(value * 10 + charToInt(c)), []]
            }
            if (c === ".") {
                return [afterDot({ value, multiplier: 0.1 }), []]
            }
            if (eSet(c)) {
                return [afterE(value), []]
            }
        }
        return continueWhiteSpace({ token: { kind: "Number", value }, position }, cp)
    }

    const afterDot = ({ value, multiplier }: NumberAfterDot) => (cp: CharAndPosition): StateResult => {
        const { c } = cp
        if (c !== null) {
            if (digitSet(c)) {
                return [afterDot({ value: value + charToInt(c) * multiplier, multiplier: multiplier * 0.1 }), []]
            }
            if (eSet(c)) {
                return [afterE(value), []]
            }
        }
        return continueWhiteSpace({ token: { kind: "Number", value }, position }, cp)
    }

    const afterE = (value: number) => (cp: CharAndPosition): StateResult => {
        const { c } = cp
        if (c !== null) {
            if (c === '-') {
                return [afterESign({ value, positive: false }), []]
            }
            const plus = afterESign({ value, positive: true })
            if (c === '+') {
                return [plus, []]
            }
            if (digitSet(c)) {
                return plus(cp)
            }
        }
        return continueWhiteSpace({ token: { kind: "Number", value }, position }, cp)
    }

    // {value}E+23 = {value} * 10 ** 23 => 10 ** (20 + 3) => {value} * ((10 ** 2) ** 10) * (10 ** 3)
    const afterESign = ({ value, positive }: NumberAfterESign) => {
        const state = (multiplier: number) => (cp: CharAndPosition): StateResult => {
            const { c } = cp
            if (c !== null) {
                if (digitSet(c)) {
                    return [state(multiplier ** 10 * multiplier * 10 ** charToInt(c)), []]
                }
            }
            return continueWhiteSpace({ token: { kind: "Number", value: value * (positive ? multiplier : 1 / multiplier) }, position }, cp)
        }
        return state(1)
    }

    return (c: string) => beforeDot(charToInt(c))
}

type NumberAfterDot = {
    readonly value: number
    readonly multiplier: number
}

type NumberAfterESign = {
    readonly value: number
    readonly positive: boolean
}
