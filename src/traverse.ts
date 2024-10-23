export type TraversalNode<V = unknown> = {
	property: string
	value: V
	level: number
	parent: TraversalNode<V> | undefined
}

export type TraversalVisit<V = unknown, R = unknown> = (
	node: TraversalNode<V>,
) => R

export type TraversalDequeue<V = unknown> = (
	q: Array<TraversalNode<V>>,
) => TraversalNode<V>

export type TraversalEnqueue<V = unknown, R = unknown> = (
	node: TraversalNode<V>,
	q: Array<TraversalNode<V>>,
	visitResult: R,
) => void

export type TraversalOptions<V = unknown, R = unknown> = {
	visit: TraversalVisit<V, R>
	dequeue: TraversalDequeue<V>
	enqueue: TraversalEnqueue<V, R>
}

export const makeSubnodes = (node: TraversalNode): TraversalNode[] => {
	const { value, level } = node

	if (typeof value !== 'object' || value === null) {
		return []
	}

	return Object.entries(value).map(([childProperty, childValue]) => ({
		property: childProperty,
		value: childValue,
		level: level + 1,
		parent: node,
	}))
}

export const shouldContinue = (visitResult: unknown) =>
	typeof visitResult === 'undefined' || Boolean(visitResult)

export type TraversalOrder = 'breadth' | 'depth'

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
export const traverse = <V = unknown, R = unknown>(
	root: V,
	{ visit, dequeue, enqueue }: TraversalOptions<V, R>,
) => {
	const q: Array<TraversalNode<V>> = [
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
