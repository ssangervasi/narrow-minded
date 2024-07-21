import {
	Narrower,
	NarrowerArr,
	NarrowerObj,
	NarrowerSome,
	Primitive,
	SOME,
} from './narrow'
import { TraversalNode, traverse, traverseObjectDepthFirst } from './traverse'

// export type NarrowableTypeof = {
// 	primitive: Primitive

// 	// expected:
// }

// export type NarrowerDescription = {
// 	primitive: Primitive
// }

// export const describeNarrower

type Diff = {
	expected: Narrower
	received: unknown
}
type DiffNode = TraversalNode<Diff>

const makeDiffNodes = (node: DiffNode): DiffNode[] => {
	const { expected, received } = node.value

	const parent = node
	const level = node.level + 1

	if (isNarrowerArr(expected) && Array.isArray(received)) {
		// Holy guacamole!
		return expected.flatMap(expectedSub => {
			return received
				.map((receivedSub, receivedIdx): [unknown, number] => [
					receivedSub,
					receivedIdx,
				])
				.filter(([receivedSub, _]) => {
					// This is broken. This will filter out any mismatches which prevents generating
					// a diff. Instead we would need to handle multiple scenarios:
					//  - There are zero matches -> push one of the mismatches so that `visit` will
					//    fail (??)
					//  - There is exactly one mwatch -> Push it
					//  - There is more than one match -> Hard because one branch N1 could generate
					//    a diff but another branch N2 matches. When N2 reaches its end, it would
					//    need to remove N1 from the diff list. Or can we do a final path to see any
					//    superseeded branches?

					// Only descend into nodes that shallow match
					// console.log('shallow match sub', expectedSub, receivedSub)

					return isShallowMatch(expectedSub, receivedSub)
				})
				.map(
					([receivedSub, receivedIdx]): DiffNode => ({
						level,
						parent,
						property: receivedIdx.toString(),
						value: {
							expected: expectedSub,
							received: receivedSub,
						},
					}),
				)
		})
	}

	if (isNarrowerObj(expected) && isRecordObj(received)) {
		return Object.entries(expected).map(([sk, se]): DiffNode => {
			const sr = received[sk]

			return {
				level,
				parent,
				property: sk,
				value: {
					expected: se,
					received: sr,
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
			const { value, level } = node
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
		return n.some(t => isShallowMatch(t, u))
	}

	if (isNarrowerArr(n)) {
		return Array.isArray(u)
	}

	if (typeof u === 'object' && u !== null) {
		return true
	}

	return false
}
