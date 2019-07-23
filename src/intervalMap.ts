// import * as intervalSequence from './intervalSequence'

export type Node<E, T> = {
    readonly kind: 'node'
    readonly edge: E
    readonly left: IntervalMap<E, T>
    readonly right: IntervalMap<E, T>
}

export type Leaf<T> = {
    readonly kind: 'leaf'
    readonly value: T
}

export type IntervalMap<E, T> = Node<E, T> | Leaf<T>

/*
const intervalMap
    : <E, T>(_: intervalSequence.IntervalSequence<E, T>) => IntervalMap<E, T>
    =
    */
