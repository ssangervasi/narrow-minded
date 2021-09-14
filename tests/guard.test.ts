import { guard, Guard } from '~/guard'
import { some } from '~/narrow'

const num = guard.with('number')
const deep = guard.with({
	n: 'number',
	child: {
		word: 'string',
	},
	things: [some(['number'], 'boolean')],
})
const freeform = new Guard(
	(u): u is string | { type: 'a' | 'b' | 'c'; things: Date[] } => {
		return (
			typeof u === 'string' ||
			(typeof u === 'object' && ['a', 'b', 'c'].includes((u as any)?.type))
		)
	},
)

describe('guard satisfied', () => {
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

describe('guard build', () => {
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
