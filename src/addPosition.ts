import * as sequence from './sequence'

export type Position = {
    /**
     * Line number. Starts with 1.
     */
    readonly line: number
    /**
     * Column number. Starts with 1.
     */
    readonly column: number
}

export type CharAndPosition = {
    /**
     * Character.
     */
    readonly c: string
    /**
     * Position.
     */
    readonly position: Position
}

export const addPosition = (i: sequence.Sequence<string>): sequence.Sequence<CharAndPosition> => {
    const nextFromPos
    : (_: Position) => (_: string) => sequence.State<string, CharAndPosition>
    = position => c => {

        const nextPosition = {
            column: c === '\n' ? 1 : position.column + 1,
            line: c === '\n' ? position.line + 1 : position.line
        }

        const next = nextFromPos(nextPosition)

        return {
            value: { c, position},
            next
        }
    }

    const result = sequence.inclusiveScan<string, CharAndPosition>(nextFromPos({ column: 1, line: 1 }))(i)

    return result
}
