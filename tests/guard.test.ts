import { unknown, Guard } from '~/guard'
import { narrow, some } from '~/narrow'

const num = Guard.narrow('number')
const deep = Guard.narrow({
	n: 'number',
	child: {
		word: 'string',
	},
	things: [some(['number'], 'boolean')],
})
const freeform = new Guard(
	(u): u is string | { type: 'a' | 'b' | 'c'; things: Date[] } => {
		return (
			narrow('string', u) ||
			(narrow(
				{
					type: 'string',
				},
				u,
			) &&
				['a', 'b', 'c'].includes(u.type))
		)
	},
)

describe('Guard#satisfied', () => {
	it('works on primitive', () => {
		expect(num.satisfied(-10.5)).toBe(true)

		expect(num.satisfied({ word: 'up' })).toBe(false)
	})

	it('works on a deep object', () => {
		expect(
			deep.satisfied({
				n: 10,
				child: {
					word: 'up',
				},
				things: [[1, 2, 3], false, true],
			}),
		).toBe(true)

		expect(deep.satisfied(-10.5)).toBe(false)
	})

	it('works with any old conditional function', () => {
		expect(freeform.satisfied('horse magorse')).toBe(true)
		expect(
			freeform.satisfied({
				type: 'b',
				things: ['not actually checked by freeform func'],
			}),
		).toBe(true)

		expect(freeform.satisfied(null)).toBe(false)
		expect(
			freeform.satisfied({
				type: 'd',
				things: [new Date()],
			}),
		).toBe(false)
	})
})

describe('Guard#build', () => {
	it('infers primitive', () => {
		const built = num.build(-5)
		expect(built).toEqual(built)
	})

	it('infers deep', () => {
		const built = deep.build({
			n: 100,
			child: {
				word: 'up',
			},
			things: [[12, 15], false],
		})
		expect(built).toEqual(built)
	})

	it('infers freeform', () => {
		const built = freeform.build({
			type: 'a',
			things: [
				new Date(),
				// Actually _is_ typechecked
				// 'this would fail'
			],
		})
		expect(built).toEqual(built)
	})
})

describe('Guard#and', () => {
	it('works with a Guard', () => {
		const hasHorse = Guard.narrow({ horse: 'string' })
		const hasHorseAndCow = hasHorse.and(Guard.narrow({ cow: 'number' }))

		expect(
			hasHorseAndCow.satisfied({
				horse: 'neigh',
				cow: 52,
			}),
		).toBe(true)

		expect(hasHorseAndCow.satisfied('womp')).toBe(false)
		expect(hasHorseAndCow.satisfied({})).toBe(false)
		expect(
			hasHorseAndCow.satisfied({
				horse: 'neigh',
			}),
		).toBe(false)
		expect(
			hasHorseAndCow.satisfied({
				cow: 12,
			}),
		).toBe(false)

		// hasHorse still works.
		expect(
			hasHorse.satisfied({
				horse: 'neigh',
				cow: 52,
			}),
		).toBe(true)
		expect(
			hasHorse.satisfied({
				cow: 52,
			}),
		).toBe(false)
	})

	it('works with a Narrower', () => {
		const hasHorse = Guard.narrow({ horse: 'string' })
		const hasHorseAndCow = hasHorse.and({ cow: 'number' })

		expect(
			hasHorseAndCow.satisfied({
				horse: 'neigh',
				cow: 52,
			}),
		).toBe(true)
	})

	it('works with a NarrowingFunction', () => {
		const hasHorse = Guard.narrow({ horse: 'string' })
		const hasHorseAndCow = hasHorse.and(
			//
			(u: unknown): u is { cow: number } => narrow({ cow: 'number' }, u),
		)

		expect(
			hasHorseAndCow.satisfied({
				horse: 'neigh',
				cow: 52,
			}),
		).toBe(true)
	})

	it('infers types', () => {
		const g = unknown
			.and(Guard.narrow({ horse: 'string' }))
			.and(Guard.narrow({ cow: 'number' }))
		const u: unknown = {
			horse: 'neigh',
			cow: 52,
		}
		if (g.satisfied(u)) {
			const p: { horse: string; cow: number } = u
			console.log(p)
		}
	})
})

describe('Doc Tests', () => {
	test('Guard.satisfied', () => {
		const myGuard = Guard.narrow({
			name: 'string',
			values: ['number'],
		})

		const good: unknown = { name: 'Horse', values: [1, 2] }
		if (myGuard.satisfied(good)) {
			console.log('Good ' + good.name)
			// => 'Good Horse'
		}

		const bad: unknown = { name: 42, values: 'Nope' }
		if (!myGuard.satisfied(bad)) {
			console.log('Bad ')
			// => 'Bad'
		}
	})

	test('Guard.narrow', () => {
		const myGuard = Guard.narrow(['string', 'number'])
		myGuard.satisfied(['horse', 42])
	})

	test('unknown', () => {
		if (unknown.and('string').satisfied('Great')) {
			console.log('Great')
		}
	})
})

describe('readme', () => {
	// import { Guard } from 'narrow-minded'

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

	it('says ping is ping', () => {
		expect(
			PingGuard.satisfied({
				type: 'ping',
				body: {
					sentAt: 1234,
				},
			}),
		).toBe(true)

		expect(
			PingGuard.satisfied({
				type: 'ping',
				body: {},
			}),
		).toBe(false)
	})

	it('says pong is pong', () => {
		expect(
			PongGuard.satisfied({
				type: 'pong',
				body: {},
			}),
		).toBe(true)

		expect(
			PongGuard.satisfied({
				type: 'ping',
				body: {
					sentAt: 1234,
					receivedAt: 2345,
				},
			}),
		).toBe(false)
	})
})
