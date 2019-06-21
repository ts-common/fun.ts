# fun.ts

[![Build Status](https://dev.azure.com/ts-common/ts-common/_apis/build/status/ts-common.fun.ts?branchName=master)](https://dev.azure.com/ts-common/ts-common/_build/latest?definitionId=30&branchName=master) [![npm version](https://badge.fury.io/js/%40ts-common%2Ffun.ts.svg)](https://badge.fury.io/js/%40ts-common%2Ffun.ts)

Pure functional subset of JavaScripts/TypeScript.

There are a lot of pure functional languages that can be compiled to JavaScript. Usually, the biggest problem with these libraries is inteoperability. For example, if you have a big project written on JavaScript, it's very challenging to rewrite parts of this project step-by-step using another language. https://github.com/jashkenas/coffeescript/wiki/List-of-languages-that-compile-to-JS#static-typing.

The project is not another functional language that can be compiled into JavaScript. The project tries to define a subset of JavaScript that can be formally verified.

The subset can be used as a safe script or as a target platform for other programming languages. 

## Potential Targets

- Markdown safe script that can be run in a browser,
- query languages,
- distributed systems, like [ALIQ](https://github.com/aliq-lang/), machine learning, AI,
- as a target platform for other functional languages.
- the subset can be recognized by browser and compiled into more optimal code (similar to asm.js).

## Wish List

- All data is immutable.
- Pure functions, without side-effects.
- Strong structural typing.
- Type inference.
- Compatibility with JavaScript and TypeScript.
  - write/read `.d.ts` files.
  - the subset should be valid JavaScript or TypeScript. So no need for additional transpilers, we only need a validator.
- The language validator should be written on JavaScript/TypeScript so it can run in a browser.
- no implicit type conversions. For example `?:` should only accept `bool` type.
- Type system should allow to describe monads. Example on pseudo-TypeScript
  ```ts
  type MonadStrategy = {
      type Monad<T>; // this line can't be compiled in TypeScript.
      readonly just: <T>(v: T) => Monad<T>
      readonly join: <T>(m: Monad<Monad<T>>) => Monad<T>
  }
  
  // Or
  type MonadStrategy = {
      type Monad { type T }; // this line can't be compiled in TypeScript.
      readonly just: <T>(v: T) => Monad { T }
      readonly join: <T>(m: Monad { T: Monad { T } }) => Monad { T }
  }
  ```
- Type system should be able to reflect JSON-Schema.

## Typing

Typing requires a languages extension. Several safe options are
- embed typing in comments.
- embed typing in a separate file.
- typing is based on special run-time definitions, similar to Json-Schema. For example `const MyType = { type: 'string', ... }`. 

Possible typing languages are
- TypeScrit,
- JS docs,
- JSON-Schema,
- Some kind of Haskell type notations?

### Proposed Typing

- JavaScript. Starts with `//:` or `/*:`
  
  ```js
  const myFunc
      //: (_: number) => string
      = v => v.toString()
  ```
  
  ```js
  const myFunc /*: (_: number) => string */ = v => v.toString()
  ```
  
  Simplified types (incompatable with TypeScript).
  ```js
  const myFunc
      //: number => string
      = v = v.toString()
  ```
  
  ```js
  //type MyType = ...
  ```
  
  ```ts
  /*type MyType = {
  
  }*/
  ```
- TypeScript
  
  ```ts
  const myFunc
      : (_: number) => string
      = v => v.toString()
  ```

## Notes

Use `hasOwnProperty()` to check if we can read such properties as `constructor`. Incorrect code:

```js
const m = x.constructor
// or
const { constructor } = x
```

Correct code:

```js
const m = Object.prototype.hasOwnProperty.call(x, 'constructor') ? x.constructor : undefined
```

## Stage One

Use semicolon as separator.

### Definition

```js
const name = expression
```

### Expression

- data
  - string `` `string` ``.
  - number `45.6`
  - object `{ a: 56 }`
  - null `null`
  - undefined `undefined`
  - boolean `true` and `false`
  - array `[ "something" ]`
  - function `a => expression` | `a => { body }`. Yes, only one argument.
- expressions:
  - `exp.property`,
  - `exp[name]`,
  - `(exp)`,
  - `?:`, 
  - arithmetic `+`, `-`, `*`, `/`, `%`, `**`
  - compare `===`, `!==`, `<=`, `>=`, `>`, `<`
  - logical `&&`, `||`, `!`
  - bitwise `|`, `&`, `^`, `~`, `<<`, `>>`, `>>>`
  - string interpolation,
  - `typeof`

### Body

```js
{
  const name = expression
  ...
  return exp
}
```

## Stage Two

- spread operators.
- destruction. `const { ["some"]: deleted, ...rest } = something`
- No semicolons.

### Definition

- `export const`
  ```js
  export const name = expression
  ```

### `.d.ts` file?

Only definitions and types. Separate declarations of type definitions and specifications.

## Stage Three

- builders. Write-only objects with limitted scope. For example
  ```ts
  {
    const x = { p: 3 }
    x.p = somefunc()
    return x
  }
  ```
- integers, `| 0`.
- nominal types, `instanceof`, `class` etc. This is required for some existing types, such as `Date`, `Set` etc.
  **Note**: `this` should be always be binded explicitly. For example, this code should give an error:
  ```js
  class A {
    x() { return this.y(); }
    y() { return 0; }
  }
  
  const a = new A();
  const f = a.x; // error is here, because a.x can't be used without binding `this`.
  ```
  As an option, we can prohibit non-lambda functions
  ```js
  class A {
    x = () => this.y()
    y = () => 0
  }
  const a = new A();
  const f = a.x; // ok
  ```
- generators, async/await?

## References

- https://en.wikipedia.org/wiki/Hindley–Milner_type_system
- https://en.wikipedia.org/wiki/Type_class
- https://en.wikipedia.org/wiki/Structural_type_system
