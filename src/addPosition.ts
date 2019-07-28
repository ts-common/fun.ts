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

const sequenceTerminal
    = sequence.just(terminal)

const nextFromPosition
    : (_: Position) => (_: string) => sequence.State<string, CharAndPosition>
    = position => c => ({
        value: { c, position },
        next: nextFromPosition(c === '\n'
            ? { column: 1, line: position.line + 1}
            : { column: position.column + 1, line: position.line }
        )
    })

const addPositionScan
    = sequence.inclusiveScan(nextFromPosition({ column: 1, line: 1 }))

export const addPosition
    : (_: sequence.Sequence<string>) => sequence.Sequence<CharAndPosition>
    = i => addPositionScan(sequence.concat(i)(sequenceTerminal))
