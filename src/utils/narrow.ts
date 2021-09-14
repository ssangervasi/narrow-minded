export type Primitive =
	| 'string'
	| 'number'
	| 'bigint'
	| 'boolean'
	| 'symbol'
	| 'undefined'
	| 'object'
	| 'function'
export type NarrowableArr = Array<
	Primitive | NarrowableObj | NarrowableArr | NarrowableSome
>
export interface NarrowableObj {
	[k: string]: Primitive | NarrowableArr | NarrowableObj | NarrowableSome
}
export type Narrowable =
	| Primitive
	| NarrowableArr
	| NarrowableObj
	| NarrowableSome

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
export type UnNarrow<N> = /*
 */ N extends Primitive
	? UnPrimitive<N>
	: N extends Array<infer N2>
	? N extends NarrowableSome
		? UnNarrow<N2>
		: Array<UnNarrow<N2>>
	: N extends Record<keyof N, infer _N2>
	? { [k in keyof N]: UnNarrow<N[k]> }
	: unknown

/**
 *
 * @param n The Narrowable schema.
 * @param u The value of unkown type to validate.
 * @returns A type assertion that `u` satisfies `n`.
 */
export const narrow = <N extends Primitive | NarrowableArr | NarrowableObj>(
	n: N,
	u: unknown,
): u is UnNarrow<N> => {
	return _narrow(n, u)
}

export const SOME = Symbol('SOME')
export type NarrowableSome = {
	[SOME]: boolean
}

/**
 * Decorates a narrowable array to indicate narrowing should use the array as a
 * set of options instead of asserting the value is an actual array.
 * @param opts The Narrowable types that the value must be one of.
 * @returns An array with the SOME symbol set to true.
 */
export const some = <NA extends NarrowableArr>(
	...opts: NA
): NA & NarrowableSome => {
	return Object.assign(opts, {
		[SOME]: true,
	})
}

/**
 * This does the actual value comparison based on the Narrowable schema.
 * It leaves out the fancy type inference.
 * @param n The schema.
 * @param u The value to validate.
 * @returns Whether u matches n.
 */
const _narrow = <N extends Narrowable>(n: N, u: unknown): boolean => {
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
				return u.every(v => n.some(t => _narrow(t, v)))
			} else {
				return false
			}
		}
	}

	if (typeof u !== 'object' || u === null) {
		return false
	}

	const o = u as NarrowableObj

	return Object.entries(n).every(([k, t]) => _narrow(t, o[k]))
}
