# fun.ts

Pure functional subset of JavaScripts/TypeScript.

## Wish List

- All data is immutable.
- Pure functions without side-effects.
- Strong structural typing.
- Type inference.
- Compatibility with JavaScript and TypeScript.
  - write/read `.d.ts` files.
  - the subset should be valid JavaScript or TypeSctipt. So no need for additional transpilers, we only need a validator.
- The language validator should be written on JavaScript/TypeScript so it can run in a browser.
- no implicit type conversions. For example `?:` should only accept `bool` type.

## Minimal Syntax

### Definition

- `const`

   ```js
   const name = expression
   ```
- `export const`
  ```js
  export const name = expression
  ```

### Expression

- data
  - string `"string"`
  - number `45.6`
  - object `{ a: 56 }`
  - null `null`
  - undefined `undefined`
  - boolean `true` and `false`
  - array `[ "something" ]`
  - function `a => expression` | `a => { body }`. Yes, only one argument.
- expressions: `?:`, `+`, `-`, `*`, `/`, `===`, `!==`, `<=`, `>=`, `>`, `<`.
- body `{ ... }`
  - definitions
  - `return exp`
