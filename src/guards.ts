export interface Message<T extends string, P> {
	type: T
	payload: P
}

export class Guard<T extends string, P> {
	readonly M = null as unknown as Message<T, P>
	readonly P = null as unknown as P
	readonly T: T

	constructor(t: T) {
		this.T = t
	}

	type<TOut extends T>(t: TOut) {
		return new Guard<TOut, P>(t)
	}

	payload<POut>() {
		return new Guard<T, POut>(this.T)
	}

	message(m: Message<string, unknown>): m is this['M'] {
		return this.T === m.type
	}

	build<Tout extends this['T']>(
		m: Omit<this['M'], 'type'> & { type?: Tout },
	): this['M'] {
		return {
			type: this.T,
			...m,
		}
	}
}

export const guard = new Guard<string, unknown>('')
