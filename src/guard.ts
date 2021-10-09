import { narrow, Narrower, UnNarrow } from './narrow'

export type NarrowingFunction<P> = (u: unknown) => u is P
export type Payload<G> = G extends Guard<infer P> ? P : unknown

/**
 *
 */
export class Guard<P> {
	/**
	 * Creates a new guard that uses a `narrow` function.
	 * A little shortcut for `new Guard(narrow(...))`.
	 * @example
	 * ```
	 * import { Guard } from 'narrow-minded'
	 * const myGuard = Guard.narrow(['string', 'number'])
	 * myGuard.satisfied(['horse', 42]) // => true
	 * ```
	 * @param n Narrower
	 * @returns Guard
	 */
	static narrow<N extends Narrower>(n: N) {
		return new Guard((u: unknown): u is UnNarrow<N> => narrow(n, u))
	}

	readonly NF: NarrowingFunction<P>

	constructor(NF: NarrowingFunction<P>) {
		this.NF = NF
	}

	/**
	 * Runs the guard's narrowing function to validate the unknown value's type.
	 * Operates as a type predicate so conditional blocks infer this structure.
	 * @example
	 * ```
	 * const myGuard = Guard.narrow({
	 * 	name: 'string',
	 * 	values: ['number'],
	 * })
	 *
	 * const good: unknown = { name: 'Horse', values: [1, 2] }
	 * if (myGuard.satisfied(good)) {
	 * 	console.log('Good ' + good.name)
	 * 	// => 'Good Horse'
	 * }
	 *
	 * const bad: unknown = { name: 42, values: 'Nope' }
	 * if (!myGuard.satisfied(bad)) {
	 * 	console.log('Bad ')
	 * 	// => 'Bad'
	 * }
	 * ```
	 * @param u The unknown value.
	 * @returns A type predicate that `u` satisfies this guard.
	 */
	satisfied(u: unknown): u is P {
		return this.NF(u)
	}

	/**
	 * An identity function that returns the value passed to it. Useful for
	 * defining objects that satisfy this guard using type inference.
	 * @param p
	 * @returns p
	 */
	build(p: P): P {
		return p
	}

	/**
	 * Creates a new guard that will satisfy the constraints of `this` AND `other`.
	 * Useful for combining primitive narrows with more complex type checking.
	 * @example
	 * ```
	 * const myGuard = Guard.narrow({ type: 'string' }).and(
	 * 	(u: unknown): u is { type: 'this' | 'that' } =>
	 * 		['this', 'that'].includes((u as any).type),
	 * )
	 * ```
	 *
	 * @param other - The or with a Narrower/NarrowerFunction which will
	 * be wrapped into a Guard automatically.
	 * @return Guard
	 */
	and<N extends Narrower>(other: N): Guard<P & UnNarrow<N>>
	and<P2>(other: Guard<P2> | NarrowingFunction<P2>): Guard<P & P2>
	and<P2>(other: any) {
		const left = this.NF
		const right =
			other instanceof Guard
				? other.NF
				: other instanceof Function
				? other
				: (u: unknown): u is P2 => narrow(other, u)
		return new Guard((u: unknown): u is P & P2 => left(u) && right(u))
	}
}

/**
 * A singleton that can be used to build `and` chains.
 * @example
 * ```
 * if (unknown.and('string').satisfied('Great')) {
 * 	console.log('Great')
 * }
 * ```
 */
export const unknown = new Guard<unknown>((_): _ is unknown => true)
