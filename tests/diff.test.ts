import { DiffResult, diffNarrow } from '~/diff'
import { Narrower } from '~/narrow'

describe('diffNarrow', () => {
	describe('depth 0', () => {
		test('match', () => {
			const n = 'string' satisfies Narrower
			const u = 'good boy'
			expect(diffNarrow(n, u)).toStrictEqual([])
		})

		test('primitive', () => {
			const n = 'number' satisfies Narrower
			const u = 'bad boy'
			expect(diffNarrow(n, u)).toStrictEqual([
				{
					level: 0,
					property: '',
					expected: 'number',
					received: 'bad boy',
				} satisfies DiffResult,
			])
		})
	})

	describe('object depth 1', () => {
		const n = {
			title: 'string',
			count: 'number',
		} satisfies Narrower

		test('match exact', () => {
			const u = {
				title: 'good boy',
				count: 3,
			}
			expect(diffNarrow(n, u)).toStrictEqual([])
		})

		test('match superset', () => {
			const u = {
				title: 'good boy',
				count: 3,
				extra: 'yep',
			}
			expect(diffNarrow(n, u)).toStrictEqual([])
		})

		test('diff root', () => {
			const u = 'bad boy'
			expect(diffNarrow(n, u)).toStrictEqual([
				{
					level: 0,
					property: '',
					expected: n,
					received: 'bad boy',
				},
			] satisfies DiffResult[])
		})

		test('diff child primitives', () => {
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

	describe('array depth 1', () => {
		const n = ['string', 'number'] satisfies Narrower

		test('empty array', () => {
			const u: unknown = []
			expect(diffNarrow(n, u)).toStrictEqual([])
		})

		test('match homogeneous', () => {
			const u: unknown = ['good boy', 'very nice']
			expect(diffNarrow(n, u)).toStrictEqual([])
		})

		test('match mixed', () => {
			const u: unknown = [2, 'good', 4, 'u']
			expect(diffNarrow(n, u)).toStrictEqual([])
		})

		test('diff root', () => {
			const u: unknown = 'bad boy'
			expect(diffNarrow(n, u)).toStrictEqual([
				{
					level: 0,
					property: '',
					expected: n,
					received: 'bad boy',
				},
			])
		})

		test('diff homogeneous', () => {
			const u: unknown = [true, false]
			expect(diffNarrow(n, u)).toStrictEqual([
				{
					level: 1,
					property: '0',
					expected: n,
					received: true,
				},
				{
					level: 1,
					property: '1',
					expected: n,
					received: false,
				},
			])
		})
	})
})
