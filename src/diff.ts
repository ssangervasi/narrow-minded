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

export type Diff = {
	expected: Narrower
	received: unknown
}
export type DiffNode = TraversalNode<Diff>

const makeDiffNodes = (node: DiffNode): DiffNode[] => {
	const { expected, received } = node.value

	const parent = node
	const level = node.level + 1

	// Holy guacamole!
	if (isNarrowerArr(expected) && Array.isArray(received)) {
		return expected.flatMap(se => {
			return received
				.map((sr, i): [unknown, number] => [sr, i])
				.filter(([sr, _]) => {
					return isShallowMatch(se, sr)
				})
				.map(
					([sr, i]): DiffNode => ({
						level,
						parent,
						property: i.toString(),
						value: {
							expected: se,
							received: sr,
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

export const diffNarrow = <N extends Narrower>(n: N, u: unknown) => {
	const diffsNodes: DiffNode[] = []

	const root: Diff = {
		expected: n,
		received: u,
	}

	traverse(root, {
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
		visit: node => {
			const { value } = node
			const { expected, received } = value

			if (isShallowMatch(expected, received)) {
				return true
			}

			diffsNodes.push({
				level: node.level,
				property: node.property,
				expected,
				received,
			})

			return false
		},
	})
}

const isNarrowerSome = (n: Narrower): n is NarrowerSome =>
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
