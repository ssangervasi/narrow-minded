import { range } from 'lodash'

import { narrow } from '~/narrow'

const timer = (f: () => void) => {
	const startMs = Date.now()
	f()
	return Date.now() - startMs
}

describe('Narrowing a big array', () => {
	beforeAll(() => {
		jest.useRealTimers()
	})

	afterAll(() => {
		jest.useFakeTimers()
	})

	xit('takes a lot less time on an empty schema', () => {
		/**
		 * This test was written to identify the performance difference when narrowing with an empty
		 * schema in narrow.ts#L188. But it turns out JS optimization is good enough that this check
		 * made no difference!
		 */
		const bigArr = range(10 ** 8)

		const emptyMs = timer(() => {
			narrow([], bigArr)
		})
		const specificMs = timer(() => {
			narrow(['number'], bigArr)
		})

		console.debug('DEBUG(ssangervasi)', { emptyMs, specificMs })

		expect(emptyMs).toBeLessThan(5)
		expect(emptyMs * 1000).toBeLessThan(specificMs)
	})
})
