import {
	Narrower,
	NarrowerArr,
	NarrowerObj,
	NarrowerSome,
	Primitive,
	some,
	SOME,
} from './narrow'
import { TraversalNode, traverse } from './traverse'

type Diff = {
	expected: Narrower
	received: unknown
}
type DiffNode = TraversalNode<Diff>

const makeDiffNodes = (node: DiffNode): DiffNode[] => {
	console.debug('DEBUG(ssangervasi)', 'makeDiffNodes', node)

	const { expected, received } = node.value

	if (isNarrowerArr(expected) && Array.isArray(received)) {
		return received.map((receivedSub, receivedIdx): DiffNode => {
			const expectArrAsSome = some(...expected)

			return {
				parent: node,
				level: node.level + 1,
				property: receivedIdx.toString(),
				value: {
					expected: expectArrAsSome,
					received: receivedSub,
				},
			}
		})
	}

	if (isNarrowerSome(expected)) {
		return [
			{
				parent: node,
				level: node.level,
				property: node.property,
				value: {
					expected: expected[0]!,
					received,
				},
			},
		]
	}

	if (isNarrowerObj(expected) && isRecordObj(received)) {
		return Object.entries(expected).map(([keySub, expectedSub]): DiffNode => {
			const receivedSub = received[keySub]

			return {
				parent: node,
				level: node.level + 1,
				property: keySub,
				value: {
					expected: expectedSub,
					received: receivedSub,
				},
			}
		})
	}

	console.debug('DEBUG(ssangervasi)', '>>> no nodes')

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
				console.debug('DEBUG(ssangervasi)', 'visit>shallow')

				return true
			}

			// If there is an ancestor some-arr that hasn't been traversed yet, then don't record
			// a diff yet. Once we get to only 1 some-arr entry remaining, `findAncestorSome` will return nothing.
			if (findAncestorSome(node)) {
				console.debug(
					'DEBUG(ssangervasi)',
					'visit>mismatched, but ancestor',
					node,
				)

				return false
			}

			console.debug('DEBUG(ssangervasi)', 'visit>mismatched, DONE', {
				expected,
				received,
			})

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
			if (visitResult) {
				const subnodes = makeDiffNodes(node)
				subnodes.reverse()
				q.push(...subnodes)
				return
			}

			const altAncestor = makeAltSomeAncestor(node)
			if (altAncestor) {
				console.debug('DEBUG(ssangervasi)', 'adding alt ancestor', {
					altAncestor,
					node,
				})

				q.push(altAncestor)
			}
		},
	})

	return diffsResults
}

/**
 * First element is the input leaf. Last element is the highest ancestor (root).
 */
const listAncestors = (leaf: DiffNode): DiffNode[] => {
	const ancestors: DiffNode[] = [leaf]
	while (true) {
		const child = ancestors[0]
		const parent = child?.parent
		if (!parent) {
			break
		}
		ancestors.unshift(parent)
	}
	ancestors.reverse()
	return ancestors
}

/**
 * Traverses the ancestors to find the lowest one that is a some-arr and has >1 entry. A some-arr with 1
 * entry would be the ancestor that led to the current (unmatched) node. Includes the input leaf as
 * the first element (if it has remaining entries).
 */
const findAncestorSome = (leaf: DiffNode): DiffNode | undefined => {
	const ancestors = listAncestors(leaf)
	return ancestors.find(parent => {
		const {
			value: { expected },
		} = parent
		return isNarrowerSome(expected) && expected.length > 1
	})
}

const makeAltSomeAncestor = (
	node: TraversalNode<Diff>,
): DiffNode | undefined => {
	const ancestorSomeNode = findAncestorSome(node)

	const ancestorExpected =
		ancestorSomeNode?.value?.expected &&
		isNarrowerSome(ancestorSomeNode?.value?.expected)
			? ancestorSomeNode.value.expected
			: undefined

	// This is the common case when there are no some-arr ancestors at all. It also comes up when all
	// ancestor some-arrs have been exhausted (reduced to only 1 option).
	if (!(ancestorSomeNode && ancestorExpected)) {
		return undefined
	}

	// Create a copy of the ancestor node with the first some-entry removed.
	return {
		parent: ancestorSomeNode.parent,
		level: ancestorSomeNode.level,
		property: ancestorSomeNode.property,
		value: {
			expected: some(...ancestorExpected.slice(1)),
			received: ancestorSomeNode.value.received,
		},
	}
}

const isNarrowerSome = (n: Narrower): n is NarrowerArr & NarrowerSome =>
	Array.isArray(n) && SOME in n

const isNarrowerArr = (n: Narrower): n is NarrowerArr =>
	Array.isArray(n) && !(SOME in n)

const isNarrowerObj = (n: Narrower): n is NarrowerObj =>
	!Array.isArray(n) && typeof n === 'object' && n !== null

const isRecordObj = (u: unknown): u is Record<string, unknown> =>
	typeof u === 'object' && u !== null && !Array.isArray(u)

const isShallowMatch = (n: Narrower, u: unknown): boolean => {
	if (typeof n === 'string') {
		return n === typeof u
	}

	if (isNarrowerSome(n)) {
		// An empty some-arr matches nothing.
		if (n.length === 0) {
			return false
		}

		// A shallow match only checks the first entry.
		const firstNSub = n[0]!
		return isShallowMatch(firstNSub, u)
	}

	if (isNarrowerArr(n)) {
		return Array.isArray(u)
	}

	if (isNarrowerObj(n)) {
		return isRecordObj(u)
	}

	return false
}
