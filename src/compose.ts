export type Func<A, B> = (_: A) => B

export type Compose<A, B, R> = (_: (_: B) => R) => (_: (_: A) => B) => (_: A) => R

export const compose
    : <B, R>(_: (_: B) => R) => <A>(_: (_: A) => B) => (_: A) => R
    = f => g => a => f(g(a))

export const pipe
    : <A, B>(_: (_: A) => B) => <R>(_: (_: B) => R) => (_: A) => R
    = g => f => compose(f)(g)
