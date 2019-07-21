import * as sign from '../sign'
import * as equal from '../equal'
import * as intervalSequence from '../intervalSequence'

export type IntervalSequence = intervalSequence.IntervalSequence<number, string>

export type IntervalLeft = intervalSequence.IntervalLeft<number, string>

export type MergeStrategy = intervalSequence.MergeStrategy<number, string, string, string>

export const strategy
    : MergeStrategy
    = {
        intervalSequence: {
            sign: sign.numberCompare,
            equal: equal.strictEqual,
        },
        reduce: a => b => `${a}.${b}`,
    }

export type IntervalMapN = intervalSequence.IntervalSequence<number, number>

export type MergeStrategyN = intervalSequence.MergeStrategy<number, number, number, number>

export const strategyN
    : MergeStrategyN
    = {
        intervalSequence: {
            sign: sign.numberCompare,
            equal: equal.strictEqual,
        },
        reduce: a => b => a < b ? a : b,
    }
