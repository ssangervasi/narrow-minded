import { sample } from 'lodash'

import { narrow, some, Narrower } from '~/narrow'

describe('narrow value checking', () => {
	it('works on primitives', () => {
		expect(narrow('function', () => {})).toBe(true)
		expect(narrow('number', 1)).toBe(true)
		expect(narrow('string', 1)).toBe(false)
	})

	it('works on null', () => {
		expect(narrow('object', null)).toBe(true)

		expect(narrow({}, false)).toBe(true)
		expect(narrow({ horse: 'string' }, null)).toBe(false)
	})

	it('works on object schemas', () => {
		const schema: Narrower = {
			horse: 'number',
			nest: {
				bird: 'string',
				cool: 'boolean',
			},
		}
		expect(narrow(schema, {})).toBe(false)
		expect(
			narrow(schema, {
				horse: 2,
				nest: {
					bird: null,
					cool: null,
				},
			}),
		).toBe(false)
		expect(
			narrow(schema, {
				horse: 2,
				nest: {
					bird: 'caw',
					cool: false,
				},
			}),
		).toBe(true)
	})

	it('works on arrays', () => {
		expect(
			narrow(
				{
					0: 'number',
				},
				[1, 2],
			),
		).toBe(true)
		expect(narrow(['number'], [1, 2])).toBe(true)
		expect(narrow(['string'], [1, 2])).toBe(false)
		expect(
			narrow(
				[
					'number',
					{
						bird: 'string',
					},
				],
				[
					1,
					2,
					{
						bird: 'caw',
					},
				],
			),
		).toBe(true)
	})

	it('works with some()', () => {
		const numOrStr = some('number', 'string')
		expect(narrow(numOrStr, 1)).toBe(true)
		expect(narrow(numOrStr, 'meow')).toBe(true)

		expect(narrow(numOrStr, [])).toBe(false)
		expect(narrow(numOrStr, {})).toBe(false)

		const numOrSchema = some('number', {
			horse: 'number',
			cows: ['string'],
			derps1: some('number', 'string'),
			derps2: some('number', 'string'),
		})
		expect(
			narrow(numOrSchema, {
				horse: 2,
				cows: ['moo', 'oink'],
				derps1: 1,
				derps2: 'two',
			}),
		).toBe(true)
		expect(narrow(numOrSchema, 1)).toBe(true)

		expect(narrow(numOrSchema, 'zang')).toBe(false)
		expect(narrow(numOrSchema, [])).toBe(false)
		expect(narrow(numOrSchema, {})).toBe(false)

		expect(narrow(some(some('number', 'undefined')), 1)).toBe(true)
		expect(narrow(some(some('number', 'undefined')), undefined)).toBe(true)
		expect(narrow(some(some('number'), 'undefined'), undefined)).toBe(true)

		expect(narrow(some(some('number', 'undefined')), 'nope')).toBe(false)
		expect(narrow(some(some('number'), 'undefined'), 'nope')).toBe(false)

		expect(
			narrow(
				{
					missing: some('number', 'undefined'),
				},
				{
					missing: undefined,
					nope: 1,
				},
			),
		).toBe(true)
		expect(
			narrow(
				{
					missing: some('number', 'undefined'),
				},
				{
					nope: 1,
				},
			),
		).toBe(true)
		expect(
			narrow(
				{
					missing: some('number'),
				},
				{
					missing: undefined,
					nope: 1,
				},
			),
		).toBe(false)
	})
})

describe('narrow conditional typing', () => {
	it('works on primitives', () => {
		const p: unknown = 42
		if (narrow('number', p)) {
			const pis: number = p
			console.log(pis)
		}
		if (!narrow('number', p)) {
			const pnot: unknown = p
			console.log(pnot)
		}
	})

	it('works with arrays', () => {
		const poa: unknown = sample([42, ['word']])
		if (narrow('number', poa)) {
			const pn: number = poa
			console.log(pn)
		}
		if (narrow(['string'], poa)) {
			const a: string[] = poa
			console.log(a)
		}
	})

	it('works typeof for array', () => {
		const poa: unknown = sample([42, ['word']])
		if (narrow('number', poa)) {
			type T = typeof poa
			const pn: T = poa
			console.log(pn)
		}
		if (narrow(['string'], poa)) {
			type T = typeof poa
			const pn: T = poa
			console.log(pn)
		}
	})

	it('works with deep arrays', () => {
		const poa: unknown = sample([['word'], [[['word']]]])
		if (narrow(['string'], poa)) {
			const a: string[] = poa
			console.log(a)
		}
		if (narrow([[['string']]], poa)) {
			const aaa: string[][][] = poa
			console.log(aaa)
		}
	})

	it('works with typeof', () => {
		const n: Narrower = {
			name: 'string',
			hooves: some('number', 'undefined'),
			baby: {
				name: 'string',
			},
		}
		const u: unknown = {
			missing: undefined,
			nope: 1,
		}
		if (narrow(n, u)) {
			type tx = typeof u
			const x: tx = {
				name: 'george',
				hooves: 4,
				baby: {
					name: 'diana',
				},
			}
			console.log(x)
		}
	})

	it('works with dictionaries', () => {
		const poa: unknown = sample([
			'word',
			[['word']],
			[
				{
					word: 1,
				},
			],
		])
		if (narrow('string', poa)) {
			const s: string = poa
			console.log(s)
		}
		if (narrow([['string']], poa)) {
			const aas: string[][] = poa
			console.log(aas)
		}
		if (
			narrow(
				[
					{
						word: 'string',
						arr: ['number'],
					},
				],
				poa,
			)
		) {
			const aos: Array<{ word: string; arr: number[] }> = poa
			console.log(aos)
		}
	})

	it('works with some()', () => {
		const u: unknown = sample([
			{
				word: 'up',
			},
			{
				word: undefined,
			},
			{
				word: 42,
			},
		])
		if (
			narrow(
				{
					word: some('string', 'undefined'),
				},
				u,
			)
		) {
			const osou: {
				word?: string
			} = u
			console.log(osou)
		}
		if (
			narrow(
				{
					word: some('number', 'bigint'),
				},
				u,
			)
		) {
			const on: {
				word: number | bigint
			} = u
			console.log(on)
		}
	})
})
