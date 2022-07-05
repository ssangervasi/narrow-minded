/**
 * Includes all values that can be returned by a `typeof` expression.
 */
export type Primitive =
	| 'string'
	| 'number'
	| 'bigint'
	| 'boolean'
	| 'symbol'
	| 'undefined'
	| 'object'
	| 'function'
export type NarrowerArr = Array<
	Primitive | NarrowerObj | NarrowerArr | NarrowerSome
>
export interface NarrowerObj {
	[k: string]: Primitive | NarrowerArr | NarrowerObj | NarrowerSome
}

/**
 * This is the type that specifies a narrowed structure. The simplest form is a Primitive string,
 * which will validate using a `typeof` comparison. Deeper structures can be defined using objects
 * and arrays that will be validated recursively.
 * @example
 * ```
 * // An array of mixed strings and numbers:
 * ['string', 'number']
 *
 * // A deep object:
 * {
 * 	n: 'number',
 * 	child: {
 * 		word: 'string'
 * 	},
 * 	things: [
 * 		['number'],
 * 		'boolean'
 * 	],
 * }
 * ```
 */
export type Narrower = Primitive | NarrowerArr | NarrowerObj | NarrowerSome

export type UnPrimitive<N> = /*
 */ N extends 'string'
	? string
	: N extends 'number'
	? number
	: N extends 'bigint'
	? bigint
	: N extends 'boolean'
	? boolean
	: N extends 'symbol'
	? symbol
	: N extends 'undefined'
	? undefined
	: N extends 'object'
	? object
	: N extends 'function'
	? Function
	: unknown

/* eslint-disable @typescript-eslint/array-type */
/**
 * This attempts to infer a narrowed type based on a Narrow schema, which results in nice types
 * within conditional blocks. If inference is not possible, the type remains `unknown`.
 *
 * An empty array as a schema is a special case: TypeScript wants to assume the contained type is
 * `never` (the array is empty, so the contents have no type) but this is not useful in practice, so
 * the content type is also replaced with `unknown`.
 */
export type UnNarrow<N> = /*
 */ N extends Primitive
	? UnPrimitive<N>
	: N extends Array<never>
	? Array<unknown>
	: N extends Array<infer N2>
	? N extends NarrowerSome
		? UnNarrow<N2>
		: Array<UnNarrow<N2>>
	: N extends Record<keyof N, infer _N2>
	? { [k in keyof N]: UnNarrow<N[k]> }
	: unknown
/* eslint-enable @typescript-eslint/array-type */

/**
 * This function validates any value with `typeof` checks. Arrays and objects are traversed
 * according to the Narrower structure. The boolean return value is also a TypeScript type
 * predicate.
 *
 * **Objects** -
 * All keys of `n` are checked against `u` and their narrow is validated if the key exists.
 * Keys that are missing from `u` are treated as having the value `undefined`. This means
 * you can use `{ key: some('undefined', ...)}` to allow for missing/optional keys.
 *
 * **Arrays** -
 * Including multiple types in a Narrower array allows for mixed types. Each item in `u` must
 * satisfy at least one of the types.
 *
 * **Null** -
 * `typeof null` is `'object'` but null cannot have any keys. Use `{}` to match an object
 * that is not null.
 *
 * @example
 * ```
 * // An array of mixed strings and numbers:
 * narrow(['string', 'number'], [1, 'two']) //=> true
 * narrow(['string', 'number'], [{}]) //=> false
 *
 * // Null:
 * narrow('object', null) //=> true
 * narrow({}, null) //=> false
 *
 * // A deep object:
 * narrow({
 * 	n: 'number',
 * 	child: {
 * 		word: 'string'
 * 	},
 * 	things: [
 * 		['number'],
 * 		'boolean'
 * 	],
 * }, {
 * 	n: 3.14,
 * 	child: {
 * 		word: 'Yes'
 * 	},
 * 	things: [
 * 		false,
 * 		[1, 2, 3],
 * 		true
 * 	]
 * }) //=> true
 * ```
 * @param n The Narrower schema.
 * @param u The value of unknown type to validate.
 * @returns A type predicate that `u` satisfies `n`.
 */
export const narrow = <N extends Primitive | NarrowerArr | NarrowerObj>(
	n: N,
	u: unknown,
): u is UnNarrow<N> => {
	return _narrow(n, u)
}

export const SOME = Symbol('SOME')
export type NarrowerSome = {
	[SOME]: boolean
}

/**
 * Decorates a narrower array to indicate narrowing should use the array as a
 * set of options instead of asserting the value is an actual array.
 * @param opts The Narrower types that the value must be one of.
 * @returns An array with the SOME symbol set to true.
 */
export const some = <NA extends NarrowerArr>(
	...opts: NA
): NA & NarrowerSome => {
	return Object.assign(opts, {
		[SOME]: true,
	})
}

/**
 * This does the actual value comparison based on the Narrower schema.
 * It leaves out the fancy type inference.
 * @private
 * @param n The schema.
 * @param u The value to validate.
 * @returns Whether u matches n.
 */
const _narrow = <N extends Narrower>(n: N, u: unknown): boolean => {
	if (typeof n === 'string') {
		if (n === typeof u) {
			return true
		} else {
			return false
		}
	}

	if (Array.isArray(n)) {
		if (SOME in n) {
			return n.some(t => _narrow(t, u))
		} else {
			if (Array.isArray(u)) {
				if (n.length === 0) {
					// An empty schema array represents an array with unknown contents.
					return true
				}

				return u.every(v => n.some(t => _narrow(t, v)))
			} else {
				return false
			}
		}
	}

	if (typeof u !== 'object' || u === null) {
		return false
	}

	const o = u as NarrowerObj

	return Object.entries(n).every(([k, t]) => _narrow(t, o[k]))
}
