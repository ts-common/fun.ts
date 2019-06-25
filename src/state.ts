export type InSet<T> = (_: T) => boolean

export type Rule<Input, Output> = {
    readonly first: State<Input, Output>
}

export type State<Input, Output> = {
    readonly transitions: readonly Transition<Input, Output>[]
    readonly done: () => Output
}

export type Transition<Input, Output> = {
    readonly set: InSet<Input>
    readonly accept: (_: Input) => State<Input, Output>
}
