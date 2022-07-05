# narrow-minded

<a href="https://www.npmjs.com/package/narrow-minded">
	<img alt="npm" src="https://img.shields.io/npm/v/narrow-minded">
</a>

<a href="https://www.harmless.dev/narrow-minded/global.html#narrow">
	<img alt="docs" src="https://img.shields.io/badge/Docs-better--docs-informational">
</a>

## Easy `typeof` validations with sophisticated TypeScript inference

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
if (narrow({ someProp: 'string' }, value)) {
  handleObj(value)
}
```

That's pretty excellent, but it becomes even better when working with nested objects and more interesting types. In the example below, let's say you want to pass `value` into `handleObj` but only if it has the correct structure.

```ts
// Some interesting type:
interface Obj {
  str: string
  arr: number[]
}

// Some code that expects that type:
const handleObj = (obj: Obj) => { /*...*/ }

// Some value with an unpredictable structure.
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
```

It is possible to check the value at runtime with a lot of `typeof` conditions. Checking nested properties becomes verbose, so often these will be omitted which may introduce bugs:

```ts
// We need to do a lot of type assertions because TypeScript does not narrow for us
// when using the `in` keyword. Don't forget to use the right checks for arrays ;)
if (
  typeof value === 'object' &&
  value !== null &&
  'str' in value &&
  typeof (value as any).str === 'string' &&
  'arr' in value &&
  Array.isArray((value as any).arr) &&
  typeof (value as any).arr[0] === 'number'
) {
  const obj: Obj = value as any
  handleObj(obj)
}
```

Or you could use `narrow`:

```ts
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

An empty array is a valid schema. The value must be an array, but its contents will not be checked. The contents will be inferred as `unknown`.

```ts
narrow([], [1, 'two', null, undefined, { key: 'value' }]) //=> true

narrow([], {}) //=> false
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


## Performance

The time complexity of `narrow` scales with the size of the schema, not the size of the value. This gives you control over the performance of the checks. A deeply nested schema with a lot of keys will take slightly longer than a shallow one, but calling a simple schema on `window` will be fast.

**Arrays are an exception**. In order to check that the array satisfies a type, all of its elements must satisfy one (or more) of the internal types. This means that the time complexity will scale with the size of the value.

If this is a concern, you can use an empty array schema to avoid checking the contents. Individual elements can be narrowed as needed. An example:

```ts
const hugeInput = [
	{ data: 1 },
	{ data: 2 },
	// ...
	{ data: 1_000_000 }
]

// SLOW: Will narrow a million objects:
if (narrow([{ data: 'number' }], hugeInput)) {
	// All items are checked, even if we don't need them...
}

// FAST: Will just confirm the input is an array:
if (narrow([], hugeInput)) {
	// Type is unknown:
	const item = hugeInput[0]
	if (narrow({ data: 'number' }, item)) {
		// Use the item...
	}
}


```

## Reusable narrowing with `Guard`

When working with object that are frequently serialized, deserialized, and passed around an application, you may want to use the same narrowing schema repeatedly. The `Guard` class makes reuse easy.


```ts
import { Guard } from 'narrow-minded'

// The class method `narrow` constructs a Guard that reuses the schema.
const MessageGuard = Guard.narrow({
  type: 'string',
  body: {},
})
```

Whenever you need to test this schema, call `.satisfied(value)` like so:

```ts
const goodValue: unknown = JSON.parse('{ "type": "message", "body": {} }')
if (MessageGuard.satisfied(goodValue)) {
  console.log(goodValue.type) //=> "message"
}

const badValue: unknown = JSON.parse('{ "foo": "bar" }')
if (!MessageGuard.satisfied(badValue)) {
  console.log('bad') //=> "bad"
}
```

### Custom guards

If you're familiar with writing type predicates, you can construct a Guard directly. The example below builds guards that have types that are more specific that primitive `typeof` narrowing can provide:

```ts
// A guard can be constructed with a custom predicate function which allows
// for arbitrary interfaces and comparisons. This guard ensures `sentAt` is
// greater than zero, which would not be possible with primitive checks.
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
    ) &&
    m.body.sentAt > 0,
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
  (m): m is Pong => MessageGuard.satisfied(m) && m.type === 'pong',
)

```

### The type within the guard: `Payload`

If you need to extract the type that a guard wraps, use the type-helper `Payload<typeof MyGuard>`:

```ts
import { Payload } from 'narrow-minded'

const payload: Payload<typeof PingGuard> = {
  type: 'ping',
  body: {
    sentAt: 1234,
  },
}

// Types match.
const ping: Ping = payload
```
