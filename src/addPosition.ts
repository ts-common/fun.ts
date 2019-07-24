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

export const terminal = ''

export const addPosition
    : (_: sequence.Sequence<string>) => sequence.Sequence<CharAndPosition>
    = i => {
        const nextFromPos
            : (_: Position) => (_: string) => sequence.State<string, CharAndPosition>
            = position => c => {

                const nextPosition = c === '\n' ?
                    { column: 1,                    line: position.line + 1 } :
                    { column: position.column + 1,  line: position.line }

                const next = nextFromPos(nextPosition)

                return {
                    value: { c, position },
                    next
                }
            }

        const withTerminal = sequence.concat(i)(sequence.fromArray([terminal]))

        return sequence.inclusiveScan(nextFromPos({ column: 1, line: 1 }))(withTerminal)
    }
