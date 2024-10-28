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

/**
 * Reverse mapping `Primitive` type to the string that represents each primitive.
 */
// prettier-ignore
export type UnPrimitive<N> =
	N extends 'string'
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

/**
 * Recursive type of an array Narow schema.
 */
export type NarrowerArr = Array<
	Primitive | NarrowerObj | NarrowerArr | NarrowerSome
>

/**
 * Recursive type of an object Narow schema
 */
export interface NarrowerObj {
	[k: string]: Primitive | NarrowerArr | NarrowerObj | NarrowerSome
}

/**
 * This is the type that specifies a narrowed structure. The simplest form is a Primitive string,
 * which will validate using a `typeof` comparison. Deeper structures can be defined using objects
 * and arrays that will be validated recursively.
 *
 * @example
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
 */
export type Narrower = Primitive | NarrowerArr | NarrowerObj | NarrowerSome

/* eslint-disable @typescript-eslint/array-type */
/**
 * This attempts to infer a narrowed type based on a Narrow schema, which results in nice types
 * within conditional blocks. If inference is not possible, the type remains `unknown`.
 *
 * An empty array as a schema is a special case: TypeScript wants to assume the contained type is
 * `never` (the array is empty, so the contents have no type) but this is not useful in practice, so
 * the content type is also replaced with `unknown`.
 */
// prettier-ignore
export type UnNarrow<N> =
	N extends Primitive
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
 * Unique symbol that is used to decorate an array of Narrower schemas.
 */
export const SOME = Symbol('SOME')

/**
 * Supplemental type for `SOME` decorated arrays. Note that this _does not_ intersect with an
 * `Array` type of any kind, because the array type must be kept generic in order for inference and
 * un-narrowing to work.
 */
export type NarrowerSome = {
	[SOME]: true
}

/**
 * Decorates a narrower array to indicate narrowing should use the array as a
 * set of options instead of asserting the value is an actual array.
 *
 * @example
 * narrow(some('number'), 1) //=> true
 * narrow({ optional: some('string', 'undefined') }), { optional: 'yep' }) //=> true
 * narrow({ optional: some('string', 'undefined') }), {}) //=> true
 *
 * @param narrowers The Narrower sub-schemas that the value must be one of.
 * @returns An array with the SOME symbol set to true.
 */
export const some = <NA extends NarrowerArr>(
	...narrowers: NA
): NA & NarrowerSome => {
	return Object.assign(narrowers, {
		[SOME]: true,
	} as const)
}

/**
 * Type guard for `NarrowerArr` type.
 * @param n Narrower schema
 * @returns true if `n` is an array and is _not_ `SOME` decorated
 */
export const isNarrowerArr = (
	n: Narrower,
): n is NarrowerArr & { [SOME]: never } => Array.isArray(n) && !(SOME in n)

/**
 * Type guard for `NarrowerSome` type.
 * @param n Narrower schema
 * @returns true if `n` is a `SOME` decorated array.
 */
export const isNarrowerSome = (n: Narrower): n is NarrowerArr & NarrowerSome =>
	Array.isArray(n) && SOME in n

/**
 * Type guard for `NarrowerObj` type
 * @param n Narrower schema
 * @returns true if `n` is an indexable object.
 */
export const isNarrowerObj = (
	n: Narrower,
): n is NarrowerObj & { [SOME]: never } => isRecordObj(n)

/**
 * Type guard for an indexable object
 * @param u Any value
 * @returns true if `u` is a non-array, non-null object.
 */
export const isRecordObj = (u: unknown): u is Record<string, unknown> =>
	typeof u === 'object' && u !== null && !Array.isArray(u)
