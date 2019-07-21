import * as sign from '../sign'
import * as equal from '../equal'
import * as intervalMap from '../intervalMap'

export type IntervalMap = intervalMap.IntervalMap<number, string>

export type IntervalLeft = intervalMap.IntervalLeft<number, string>

export type MergeStrategy = intervalMap.MergeStrategy<number, string, string, string>

export const strategy
    : MergeStrategy
    = {
        intervalMap: {
            sign: sign.numberCompare,
            equal: equal.strictEqual,
        },
        reduce: a => b => `${a}.${b}`,
    }

export type IntervalMapN = intervalMap.IntervalMap<number, number>

export type MergeStrategyN = intervalMap.MergeStrategy<number, number, number, number>

export const strategyN
    : MergeStrategyN
    = {
        intervalMap: {
            sign: sign.numberCompare,
            equal: equal.strictEqual,
        },
        reduce: a => b => a < b ? a : b,
    }
