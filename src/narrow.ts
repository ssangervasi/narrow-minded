import {
	Narrower,
	NarrowerArr,
	NarrowerObj,
	NarrowerSome,
	Primitive,
	SOME,
	UnNarrow,
} from './schema'

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
 *
 * @param n The Narrower schema.
 * @param u The value of unknown type to validate.
 * @returns A type predicate that `u` satisfies `n`.
 */
export const narrow = <
	N extends Primitive | NarrowerArr | NarrowerObj | NarrowerSome,
>(
	n: N,
	u: unknown,
): u is UnNarrow<N> => {
	return _narrow(n, u)
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
