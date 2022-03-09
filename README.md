# narrow-minded

## Easy (but deep) `typeof` validation with sophisticated TypeScript inference

This package exists to make type safety easy for unstructured data. This includes runtime access if you're only using JavaScript, but gets even nicer with TypeScript.

The gist is to take code like this:

```ts
// JSON is a common case, but any questionable value can be used.
const value: unknown = JSON.parse(mysteryString)

// This gives up type checking, breaks on non-object values,
// and doesn't narrow the type but instead relies on type assertion.
if ((value as any).someProp !== undefined) {
  handleObj(value as any)
}
```

and replace it with code like this:

```ts
import { narrow } from 'narrow-minded'

// Succinct, does not break on strange values, and uses type guards so that
// no assertions are necessary within the conditional block.
if (narrow({ str: 'string' }, value)) {
  handleObj(value)
}
```

That's pretty excellent, but it becomes even better when working with nested objects and more interesting types:

```ts
interface Obj {
  str: string
  arr: number[]
}

const handleObj = (obj: Obj) => { /*...*/ }

// Another contrived value.
const value = [
  {
    str: 'Only valid object',
    arr: [1, 2, 3],
  },
  {
    str: 'Almost correct, but not quite',
    arr: ['one'],
  },
  3.14,
  null,
][Math.round(Math.random() * 10) % 4]

// Safe at runtime, but still requires type assertions because TypeScript
// does not narrow when using the `in` keyword. Don't forget to use the right
// checks for arrays ;)
if (
  typeof value === 'object' &&
  value !== null &&
  typeof (value as any).someStr === 'string' &&
  Array.isArray((value as any).arr) &&
  typeof (value as any).arr[0] === 'number'
) {
  const obj: Obj = value as any
  handleObj(obj)
}

// Safer, fits on one line, and infers the nested types!
if (narrow({ str: 'string', arr: ['number'] }, value)) {
  handleObj(value)
}
```

## How to use `narrow`

Like this:

```ts
if (narrow(schema, value)) {
  // Do something with value...
}
```

Where `value` can be anything and `schema` is a string, object, or array as described below.

The `narrow` function is a [type predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates), meaning it returns a boolean and informs TypeScript of the type. That makes it very useful in `if (narrow(...))` and `if (!narrow(...))` blocks.

### Primitives
Values are checked with JS's built-in `typeof` operator. Any string supported by `typeof` is a valid schema. [Here](/src/narrow.ts#L4) is a type that includes all possible primitives:

```ts
type Primitive =
  | 'string'
  | 'number'
  | 'bigint'
  | 'boolean'
  | 'symbol'
  | 'undefined'
  | 'object'
  | 'function'
```

### Objects
If the schema is an object, all keys of the schema are checked against the keys of the value. The schema can be recursive, and the narrowing will continue as long as the values match.

Keys that are missing from the value object are treated as if they are present, but are equal to `undefined`. This means you can use `{ key: some('undefined', ...) }` to allow for missing/optional keys ([some](#some-optionals)).

### Arrays
Including multiple type strings in an array schema allows for mixed types. Each item in the value array must satisfy _at least one_ of the types.

```ts
narrow(['number', 'string'], [1, 'two']) //=> true

narrow(['number'], [1, 'two']) //=> false
```

An array is an object. Not all objects are arrays. You can use this to confuse yourself and your friends.

```ts
narrow(['string']          , ['an', 'array']) //=> true
narrow('object'            , ['an', 'array']) //=> true <-- gotcha
narrow({ length: 'number' }, ['an', 'array']) //=> true <-- don't do this
narrow({ length: 'number' }, { length: 2 }  ) //=> true <-- well, okay, fine.

narrow(['string'], {}                               )) //=> false
narrow(['string'], { length: 2 }                    )) //=> false <-- obviously
narrow(['string'], { length: 2, 0: 'an', 1: 'array' }) //=> false <-- oh good!

```

### `some` (Optionals)
Arrays can contain a mix of types. What if you want a single value that can be a variety of types? Use `some(schemaA, schemaB, ...)`.

```ts
import { narrow, some } from 'narrow-minded'

narrow(some('number', 'string'), 1) //=> true
narrow(some('number', 'string'), 'two') //=> true
narrow(some('number', 'undefined'), undefined) //=> true
narrow(some('string', {}), { key: 10}) //=> true
narrow({ key: some('number', 'undefined')}, {}) //=> true

narrow(some('number', 'string'), { key: 10 }) //=> false
narrow(some('number', 'string'), ['nested']) //=> false
```

### Null
Thanks to the beauty of JS, `typeof null` is `'object'`. However, null cannot have any keys. This means you should use `{}` to match an object that is not null.

```ts
narrow('object', null) //=> true
narrow({}, { key: 'value' }) //=> true

narrow({}), null) //=> false
narrow(some({}, 'undefined'), null) //=> false
```


## Reusable type guards



```ts
import { Guard, narrow } from 'narrow-minded'

// The class method `narrow` can be used to construct a guard that validates
// the primitive schema.
const MessageGuard = Guard.narrow({
  type: 'string',
  body: {},
})

// A guard can be constructed with a custom predicate function which allows
// for arbitrary interfaces and comparisons.
interface Ping {
  type: 'ping'
  body: {
    sentAt: number
  }
}
const PingGuard = new Guard(
  (m): m is Ping =>
    MessageGuard.satisfied(m) &&
    m.type === 'ping' &&
    narrow(
      {
        sentAt: 'number',
      },
      m.body,
    ),
)

// The guard's function is entirely custom, which means you can choose to sacrifice
// some safety to gain some performance. For example, this guard assumes the body
// has the correct schema without actually checking.
interface Pong {
  type: 'pong'
  body: {
    sentAt: number
    receivedAt: number
  }
}
const PongGuard = new Guard(
  (m): m is Ping => MessageGuard.satisfied(m) && m.type === 'pong',
)

```