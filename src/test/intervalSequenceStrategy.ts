import * as sign from '../sign'
import * as equal from '../equal'
import * as intervalSequence from '../intervalSequence'

export type IntervalSequence = intervalSequence.IntervalSequence<number, string>

export type IntervalLeft = intervalSequence.IntervalLeft<number, string>

export type Strategy = intervalSequence.Strategy<number, string>

export type Reduce = intervalSequence.Reduce<string, string, string>

export const strategy
    : Strategy
    = {
       sign: sign.numberCompare,
       equal: equal.strictEqual,
    }

export const reduce
    : Reduce
    = a => b => `${a}.${b}`

export const merge = intervalSequence.merge(strategy)(reduce)

export type IntervalMapN = intervalSequence.IntervalSequence<number, number>

export type StrategyN = intervalSequence.Strategy<number, number>

export type ReduceN = intervalSequence.Reduce<number, number, number>

export const strategyN
    : StrategyN
    = {
       sign: sign.numberCompare,
       equal: equal.strictEqual,
    }

export const reduceN
    : ReduceN
    = a => b => a < b ? a : b

export const mergeN = intervalSequence.merge(strategyN)(reduceN)
