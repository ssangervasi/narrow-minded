import { DiffResult, diffNarrow } from '~/diff'
import { Narrower } from '~/narrow'

describe('diffNarrow', () => {
	describe('object depth 1', () => {
		it('finds no diff', () => {
			const n = {
				title: 'string',
				count: 'number',
			} satisfies Narrower
			const u = {
				title: 'good boy',
				count: 3,
			}
			expect(diffNarrow(n, u)).toStrictEqual([])
		})

		it('finds diff', () => {
			const n = {
				title: 'string',
				count: 'number',
			} satisfies Narrower
			const u = {
				title: 10,
				count: 'bad boy',
			}
			expect(diffNarrow(n, u)).toMatchObject<DiffResult[]>([
				{
					level: 1,
					property: 'title',
					expected: 'string',
					received: 10,
				},
				{
					level: 1,
					property: 'count',
					expected: 'number',
					received: 'bad boy',
				},
			])
		})
	})
})
