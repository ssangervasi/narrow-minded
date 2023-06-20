export type TraversalNode = {
	property: string
	value: unknown
	level: number
	parent: TraversalNode | undefined
}

export type TraversalVisit = (node: TraversalNode) => unknown

export type TraversalDequeue = (q: TraversalNode[]) => TraversalNode

export type TraversalEnqueue = (
	node: TraversalNode,
	q: TraversalNode[],
	visitResult: unknown,
) => void

export type TraversalOrder = 'breadth' | 'depth'

export type TraversalOptions = {
	visit: TraversalVisit
	dequeue: TraversalDequeue
	enqueue: TraversalEnqueue
}

export const makeSubnodes = (node: TraversalNode): TraversalNode[] => {
	const { value, level } = node

	if (typeof value !== 'object' || value === null) {
		return []
	}

	return Object.values(value).map(([childProperty, childValue]) => ({
		property: childProperty,
		value: childValue,
		level: level + 1,
		parent: node,
	}))
}

export const shouldContinue = (visitResult: unknown) =>
	typeof visitResult === 'undefined' || Boolean(visitResult)

export const DEFAULT_TRAVERSALS: Record<
	TraversalOrder,
	{
		dequeue: TraversalDequeue
		enqueue: TraversalEnqueue
	}
> = {
	depth: {
		dequeue: q => q.pop()!,
		enqueue: (node, q, visitResult) => {
			if (!shouldContinue(visitResult)) {
				return
			}

			const subnodes = makeSubnodes(node)
			subnodes.reverse()
			q.push(...subnodes)
		},
	},
	breadth: {
		dequeue: q => q.shift()!,
		enqueue: (node, q, visitResult) => {
			if (!shouldContinue(visitResult)) {
				return
			}

			const subnodes = makeSubnodes(node)
			q.push(...subnodes)
		},
	},
}

/**
 * Generic tree traversal.
 */
export const traverse = (
	root: unknown,
	{ visit, dequeue, enqueue }: TraversalOptions,
) => {
	const q: TraversalNode[] = [
		{
			property: '',
			value: root,
			level: 0,
			parent: undefined,
		},
	]

	while (q.length > 0) {
		const node = dequeue(q)
		const visitResult = visit(node)
		enqueue(node, q, visitResult)
	}
}

export const traverseObjectDepthFirst = (
	root: unknown,
	visit: TraversalVisit,
) =>
	traverse(root, {
		visit,
		dequeue: DEFAULT_TRAVERSALS.depth.dequeue,
		enqueue: DEFAULT_TRAVERSALS.depth.enqueue,
	})

export const traverseObjectBreadthFirst = (
	root: unknown,
	visit: TraversalVisit,
) =>
	traverse(root, {
		visit,
		dequeue: DEFAULT_TRAVERSALS.breadth.dequeue,
		enqueue: DEFAULT_TRAVERSALS.breadth.enqueue,
	})
