import * as intervalSequence from './intervalSequence'

export type Transition = undefined | (() => State)

export type State = intervalSequence.IntervalSequence<string, Transition>
