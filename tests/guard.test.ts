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
	it('works', () => {
		const hasHorse = Guard.narrow({ horse: 'string' })
		const hasHorseAndCow = hasHorse.and({ cow: 'number' })

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

	it('infers types', () => {
		const g = unknown.and({ horse: 'string' }).and({ cow: 'number' })
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
})
