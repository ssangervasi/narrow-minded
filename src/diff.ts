import {
	Narrower,
	NarrowerArr,
	NarrowerObj,
	NarrowerSome,
	Primitive,
	some,
	SOME,
} from './narrow'
import { TraversalNode, traverse, traverseObjectDepthFirst } from './traverse'

type Diff = {
	expected: Narrower
	received: unknown
}
type DiffNode = TraversalNode<Diff>

type SubExpected = { property: string; expected: Narrower }
const unwrapSubExpected = (expected: Narrower): SubExpected[] => {
	if (isNarrowerObj(expected)) {
		return Object.entries(expected).map(
			([keySub, expectedSub]): SubExpected => ({
				property: keySub,
				expected: expectedSub,
			}),
		)
	}
	
	if (isNarrowerArr(expected)) {
		return expected.map(
			(expectedSub, expectedIdx): SubExpected => ({
				property: '0',
				expected: expectedSub,
			}),
		)
	}

	return []
}

const makeDiffNodes = (node: DiffNode): DiffNode[] => {
	const { expected, received } = node.value

	const parent = node
	const level = node.level + 1

	if (isNarrowerArr(expected) && Array.isArray(received)) {
		const expectArrAsSome = some(...expected)

		return received.map(
			(receivedSub, receivedIdx): DiffNode => ({
				level,
				parent,
				property: receivedIdx.toString(),
				value: {
					expected: expectArrAsSome,
					received: receivedSub,
				},
			}),
		)
	}

	if (isNarrowerSome(expected) && Array.isArray(received)) {
		return received.map((receivedSub, receivedIdx): DiffNode => {
			const expectedSub = some(
				...expected.filter(someSub => isShallowMatch(someSub, receivedSub)),
			)

			return {
				level,
				parent,
				property: receivedIdx.toString(),
				value: {
					expected: expectedSub,
					received: receivedSub,
				},
			}
		})
		// return [
		// 	{
		// 		level,
		// 		parent,
		// 		property: receivedIdx.toString(),
		// 		value: {
		// 			expected: expectedSomeSub,
		// 			received: receivedSub,
		// 		},
		// 	},
		// ]
	}

	if (isNarrowerObj(expected) && isRecordObj(received)) {
		return Object.entries(expected).map(([keySub, expectedSub]): DiffNode => {
			const receivedSub = received[keySub]

			return {
				level,
				parent,
				property: keySub,
				value: {
					expected: expectedSub,
					received: receivedSub,
				},
			}
		})
	}

	return []
}

export type DiffResult = {
	level: number
	property: string
	expected: Narrower
	received: unknown
}

export const diffNarrow = <N extends Narrower>(n: N, u: unknown) => {
	const diffsResults: DiffResult[] = []

	const root: Diff = {
		expected: n,
		received: u,
	}

	traverse(root, {
		visit: node => {
			const { value } = node
			const { expected, received } = value

			if (isShallowMatch(expected, received)) {
				return true
			}

			diffsResults.push({
				level: node.level,
				property: node.property,
				expected,
				received,
			})

			return false
		},
		dequeue: q => q.pop()!,
		enqueue: (node, q, visitResult: boolean) => {
			if (!visitResult) {
				return
			}
			const subnodes = makeDiffNodes(node)
			subnodes.reverse()
			q.push(...subnodes)
		},
	})

	return diffsResults
}

const isNarrowerSome = (n: Narrower): n is NarrowerArr & NarrowerSome =>
	Array.isArray(n) && SOME in n

const isNarrowerArr = (n: Narrower): n is NarrowerArr =>
	Array.isArray(n) && !(SOME in n)

const isNarrowerObj = (n: Narrower): n is NarrowerObj =>
	!Array.isArray(n) && typeof n === 'object' && n !== null

const isRecordObj = (u: unknown): u is Record<string, unknown> =>
	typeof u === 'object' && u !== null

const isShallowMatch = (n: Narrower, u: unknown): boolean => {
	if (typeof n === 'string') {
		return n === typeof u
	}

	if (isNarrowerSome(n)) {
		// "Shallow" is a bit misleading.
		return n.some(nSub => isShallowMatch(nSub, u))
	}

	if (isNarrowerArr(n)) {
		return Array.isArray(u)
	}

	if (typeof u === 'object' && u !== null) {
		return true
	}

	return false
}
