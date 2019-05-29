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
- body `{ ... }`
  ```js
  const name = expression
  ...
  return exp
  ```

### `.d.ts` file.

Only definitions and types. Separate declarations of type definitions and specifications.

## Next Stage

- nominal types, `instanceof`, `class` etc. This is required for some existing types, such as `Date`, `Set` etc.
  **Note**: `this` should be always be binded explicitly. For example, this code should give an error:
  ```
  class A {
    x() { return this.y(); }
    y() { retunr 0; }
  }
  
  const a = new A();
  const f = a.x; // error is here, because a.x can't be used without binding `this`.
  ```
- generators, async/await.
