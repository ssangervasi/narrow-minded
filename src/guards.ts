import { narrow, Narrowable, UnNarrow } from './narrow'

type Narrower<P> = (u: unknown) => u is P
export class Guard<P> {
	readonly p = null as unknown as P
	readonly nf = (() => {}) as unknown as Narrower<P>

	constructor(nf?: Narrower<P>) {
		if (typeof nf == 'function') {
			this.nf = nf
		}
	}

	satisfied(u: unknown): u is this['p'] {
		return this.nf(u)
	}

	build(p: this['p']): this['p'] {
		return p
	}

	with<N extends Narrowable>(n: N) {
		return new Guard((u: unknown): u is UnNarrow<N> => narrow(n, u))
	}
}

export const guard = new Guard<unknown>()
