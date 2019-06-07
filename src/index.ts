import * as _ from "@ts-common/iterator"
import { CharAndPosition, Position } from "@ts-common/add-position"

type CharSet = (c: string) => boolean

const interval = (min: string, max: string): CharSet => (c: string | null) => c !== null && min <= c && c <= max

const one = (v: string): CharSet => (c: string) => v === c

const union = (...sets: readonly CharSet[]): CharSet => (c: string) => _.some(sets, set => set(c))

const upperCaseLetterSet = interval('A', 'B')

const lowerCaseLetterSet = interval('a', 'b')

const digitSet = interval('0', '9')

const letterSet = union(upperCaseLetterSet, lowerCaseLetterSet)

const firstIdLetterSet = union(one('$'), one('_'), letterSet)

const restIdLetterSet = union(firstIdLetterSet, digitSet)

const whiteSpace = union(one(' '), one('\t'), one('\n'), one('\r'))

type Terminal = {
    readonly kind: "Terminal"
}

type UnknownCharacter = {
    readonly kind: "UnknownCharacter"
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

type Int = {
    readonly kind: "Int"
    readonly value: number
}

type Float = {
    readonly kind: "Float"
    readonly value: number
}

type Token = Terminal | UnknownCharacter | Id | Int | Float | Symbol

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
        ? [createIntState(position)(c), []]
    : symbolSet(c)
        ? [whiteSpaceState, [{ token: { kind: "Symbol", c }, position }]]
        : [whiteSpaceState, [{ token: { kind: "UnknownCharacter", c }, position }]]

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

const createIntState = (position: Position) => {
    const nextState = (value: number): State => cp => {
        const c = cp.c
        if (c !== null) {
            if (digitSet(c)) {
                return [nextState(value * 10 + charToInt(c)), []]
            }
        }
        return continueWhiteSpace({ token: { kind: "Int", value }, position }, cp)
    }
    return (c: string) => nextState(charToInt(c))
}
