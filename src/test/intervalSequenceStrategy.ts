import * as sign from '../sign'
import * as equal from '../equal'
import * as intervalSequence from '../intervalSequence'

export type IntervalSequenceS = intervalSequence.IntervalSequence<number, string>

export type IntervalLeftS = intervalSequence.IntervalLeft<number, string>

export type ReduceS = intervalSequence.Reduce<string, string, string>

export type StrategyS = intervalSequence.Strategy<number, string>

export const reduceS
    : ReduceS
    = a => b => `${a}.${b}`

export const strategyS
    : StrategyS
    = {
        compare: sign.numberCompare,
        equal: equal.strictEqual,
    }

export const mergeS = intervalSequence.merge(strategyS)(reduceS)

export type IntervalSequenceN = intervalSequence.IntervalSequence<number, number>

export type StrategyN = intervalSequence.Strategy<number, number>

export type ReduceN = intervalSequence.Reduce<number, number, number>

export const strategyN
    : StrategyN
    = {
        compare: sign.numberCompare,
        equal: equal.strictEqual,
    }

export const reduceN
    : ReduceN
    = a => b => a < b ? a : b

export const mergeN = intervalSequence.merge(strategyN)(reduceN)
