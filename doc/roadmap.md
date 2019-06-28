# Roadmap

## Stage Zero

Subset parser, no type analysis. 

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
