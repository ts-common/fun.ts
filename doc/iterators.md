# JS Iterator vs fun.ts Sequence

## JS Iterator

```ts
type IteratorResult<T> = {
    readonly done: true
} | {
    readonly done: false
    readonly value: T
}

type Iterator<T> = {
    readonly next: () => IteratorResult<T>;
}

type Iterable<T> = {
    readonly [Symbol.iterator]: () => Iterator<T>;
}
```

## fun.ts Sequence

```ts
type Sequence<T> = {
    readonly value: T
    readonly next: () => Sequence<T> | undefined
}
```
