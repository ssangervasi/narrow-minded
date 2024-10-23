import { DiffResult, diffNarrow } from '~/diff'
import { Narrower, some } from '~/narrow'

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

	describe('object depth 2', () => {
		const n = {
			id: 'string',
			data: {
				count: 'number',
				isCool: 'boolean',
			},
		} satisfies Narrower

		test('match exact', () => {
			const u = {
				id: 'good-boy',
				data: {
					count: 1_000,
					isCool: true,
				},
			}
			expect(diffNarrow(n, u)).toStrictEqual([])
		})

		test('diff at multi depth', () => {
			const u = {
				id: 300,
				data: {
					count: 'ten',
					isCool: null,
				},
			}
			expect(diffNarrow(n, u)).toStrictEqual([
				{
					level: 1,
					property: 'id',
					expected: 'string',
					received: 300,
				},
				{
					level: 2,
					property: 'count',
					expected: 'number',
					received: 'ten',
				},
				{
					level: 2,
					property: 'isCool',
					expected: 'boolean',
					received: null,
				},
			] satisfies DiffResult[])
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
					expected: some(...n),
					received: true,
				},
				{
					level: 1,
					property: '1',
					expected: some(...n),
					received: false,
				},
			])
		})
	})

	describe('array depth 2', () => {
		const n = [
			{
				x: 'number',
				y: 'number',
			},
			['number'],
		] satisfies Narrower

		test('match', () => {
			const u: unknown = [
				// Also shows extra properties aren't diffed.
				[10, 20],
				[10, 20, 30],
				{ x: 11, y: 21, z: 31 },
			]
			expect(diffNarrow(n, u)).toStrictEqual([])
		})

		test('diff homogeneous', () => {
			const u: unknown = [
				//
				['nope'],
				[10, 20, null],
				{ x: 11, y: undefined },
				// These are fine
				[12, 22],
				{ x: 12, y: 22 },
			]
			const nSub = some(...n)
			expect(diffNarrow(n, u)).toStrictEqual([
				{
					level: 2,
					property: '0',
					expected: nSub,
					received: 'nope',
				},
				{
					level: 2,
					property: '2',
					expected: nSub,
					received: null,
				},
			])
		})
	})
})
