import {
	isNarrowerArr,
	isNarrowerObj,
	isNarrowerSome,
	isRecordObj,
	Narrower,
	some,
} from './schema'
import { TraversalNode, traverse } from './traverse'

type Diff = {
	expected: Narrower
	received: unknown
}
type DiffNode = TraversalNode<Diff>

/**
 *
 */
export type DiffResult = {
	level: number
	property: string
	expected: Narrower
	received: unknown
}

/**
 *
 * @example
 * // Given this failed narrow:
 * narrow(
 * 	{
 * 		title: 'string',
 * 		count: 'number',
 * 	},
 * 	{
 * 		title: 10,
 * 		count: 'bad boy',
 * 	},
 * )
 * //=> false
 *
 * // The diff would be:
 * diffNarrow(
 * 	{
 * 		title: 'string',
 * 		count: 'number',
 * 	},
 * 	{
 * 		title: 10,
 * 		count: 'bad boy',
 * 	},
 * )
 * //=>
 * [
 * 	{
 * 		level: 1,
 * 		property: 'title',
 * 		expected: 'string',
 * 		received: 10,
 * 	},
 * 	{
 * 		level: 1,
 * 		property: 'count',
 * 		expected: 'number',
 * 		received: 'bad boy',
 * 	},
 * ]
 * @param n
 * @param u
 * @returns Array of `DiffResult` objects that indicate where `u` failed to satisfy `n`. An empty
 * array is the same as `narrow(n, u)` returning true.
 */
export const diffNarrow = <N extends Narrower>(n: N, u: unknown) => {
	const diffResults: DiffResult[] = []

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

			// If there is an ancestor some-arr that hasn't been traversed yet, then don't record a diff
			// yet. Once we get to only 1 some-arr entry remaining, `findAncestorSome` will return
			// nothing.
			//
			// This is called a second time within `enqueue` which is a performance hit. This could be
			// restructured to only do the tree climb once.
			if (findAncestorSome(node)) {
				return false
			}

			diffResults.push({
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
				q.push(altAncestor)
			}
		},
	})

	return diffResults
}

/**
 * Checks if `node` needs to be traversed and builds the required sub-nodes.
 */
const makeDiffNodes = (node: DiffNode): DiffNode[] => {
	const { expected, received } = node.value

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
		// Every some-arr is shallow-matched against the first entry, so only enqueue a node for the
		// first entry. If `visit` results in a mismatch down the this branch, `makeAltSomeAncestor`
		// creates a node with that first branch removed.
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

	return []
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

/**
 * Searches the node's ancestors for the deepest some-node that has remaining alternative schemas.
 * If found, the first some-entry is popped and a copy of the node with that (already checked) entry
 * removed.
 */
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

const isShallowMatch = (n: Narrower, u: unknown): boolean => {
	if (typeof n === 'string') {
		return n === typeof u
	}

	if (isNarrowerObj(n)) {
		return isRecordObj(u)
	}

	if (isNarrowerArr(n)) {
		return Array.isArray(u)
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

	return false
}
