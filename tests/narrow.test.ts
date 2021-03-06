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

		expect(narrow({}, null)).toBe(false)
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

		expect(
			narrow(
				[],
				[
					1,
					'caw',
					{},
					{
						bird: 'caw',
					},
					null,
					undefined,
				],
			),
		).toBe(true)
		expect(narrow([], {})).toBe(false)
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

// These tests are for verification of types at compile time.
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
		if (narrow([], poa)) {
			// `Array[unknown]` instead of `Array<never>`.
			const u = poa
			console.log(u)
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

// Tests for snippets that are in the README.
describe('README', () => {
	test('simple example', () => {
		interface Obj {
			str: string
		}

		const handleObj = (obj: Obj) => obj

		const untrustedString = JSON.stringify({ str: 'horse' })

		// JSON is a common case, but any questionable value can be used.
		const value: unknown = JSON.parse(untrustedString)

		// This gives up type checking, breaks on non-object values,
		// and doesn't narrow the type but instead relies on type assertion.
		if (typeof (value as any).str === 'string') {
			handleObj(value as any)
		}

		// Succinct, does not break on strange values, and uses type guards so that
		// no assertions are necessary within the conditional block.
		if (narrow({ str: 'string' }, value)) {
			handleObj(value)
		}
	})

	test('longer example', () => {
		// Some interesting type:
		interface Obj {
			str: string
			arr: number[]
		}

		// Some code that expects that type:
		const handleObj = (obj: Obj) => {
			/*...*/
		}

		// Some value with an unpredictable structure:
		const value: unknown = [
			{
				str: 'Only valid object',
				arr: [1, 2, 3],
			},
			{
				str: 'Almost correct, but not quite',
				arr: ['one'],
			},
			3.14,
			null,
		][Math.round(Math.random() * 10) % 4]

		// We need to do a lot of type assertions because TypeScript does not narrow for us
		// when using the `in` keyword. Don't forget to use the right checks for arrays ;)
		if (
			typeof value === 'object' &&
			value !== null &&
			'str' in value &&
			typeof (value as any).str === 'string' &&
			'arr' in value &&
			Array.isArray((value as any).arr) &&
			typeof (value as any).arr[0] === 'number'
		) {
			const obj: Obj = value as any
			handleObj(obj)
		}

		// Safer, fits on one line, and infers the nested types!
		if (narrow({ str: 'string', arr: ['number'] }, value)) {
			handleObj(value)
		}
	})

	test('arrays lol', () => {
		expect(narrow(['string'], ['an', 'array'])).toEqual(true)
		expect(narrow('object', ['an', 'array'])).toEqual(true)
		expect(narrow({ length: 'number' }, ['an', 'array'])).toEqual(true)
		expect(narrow({ length: 'number' }, { length: 2 })).toEqual(true)

		expect(narrow(['string'], {})).toEqual(false)
		expect(narrow(['string'], { length: 2 })).toEqual(false)
		expect(narrow(['string'], { 0: 'an', 1: 'array', length: 2 })).toEqual(
			false,
		)
	})

	test('null', () => {
		expect(narrow({ key: some('number', 'undefined') }, {})).toEqual(true)
		expect(narrow({ key: some('number', 'undefined') }, { key: 10 })).toEqual(
			true,
		)

		expect(narrow('object', null)).toEqual(true)
		expect(narrow({}, { key: 'value' })).toEqual(true)

		expect(narrow(some({}, 'undefined'), null)).toEqual(false)
	})
})
