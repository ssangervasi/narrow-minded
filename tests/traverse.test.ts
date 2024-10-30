import {
	traverse,
	traverseObjectDepthFirst,
	traverseObjectBreadthFirst,
	TraversalNode,
	TraversalVisit,
} from '~/traverse'

const withCollector = (cb: (visit: (node: TraversalNode) => void) => void) => {
	const collection: TraversalNode[] = []
	const visit = (node: TraversalNode) => {
		collection.push(node)
	}
	cb(visit)
	return collection
}

describe('traverse with custom methods', () => {
	const traverseCustom = (root: number, visit: TraversalVisit<number, void>) =>
		traverse(root, {
			visit,
			dequeue(q) {
				return q.pop()!
			},
			enqueue(n, q) {
				if (n.value <= 2) {
					/* empty */
				} else if (n.value % 2 === 0) {
					q.push({
						value: n.value / 2,
						property: '',
						level: 0,
						parent: undefined,
					})
				} else {
					q.push({
						value: 3 * n.value + 1,
						property: '',
						level: 0,
						parent: undefined,
					})
				}
			},
		})

	it('solves collatz', () => {
		const collected = withCollector(visit => traverseCustom(17, visit))
		expect(collected.map(n => n.value)).toStrictEqual([
			17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2,
		])
	})
})

describe('traverseObjectDepthFirst', () => {
	it('works on a primitive', () => {
		expect(
			withCollector(visit => traverseObjectDepthFirst('howdy', visit)),
		).toMatchObject<TraversalNode[]>([
			{
				property: '',
				value: 'howdy',
				level: 0,
				parent: undefined,
			},
		])
	})

	it('works on an array', () => {
		const root = ['howdy', ["let's throw", 'a ho-down'], 'partner']
		const collected = withCollector(visit =>
			traverseObjectDepthFirst(root, visit),
		)
		expect(collected).toMatchObject<TraversalNode[]>([
			{
				property: '',
				value: root,
				level: 0,
				parent: undefined,
			},
			{
				property: '0',
				value: root[0],
				level: 1,
				parent: expect.objectContaining({ level: 0 }),
			},
			{
				property: '1',
				value: root[1],
				level: 1,
				parent: expect.objectContaining({ level: 0 }),
			},
			{
				property: '0',
				value: root[1]![0],
				level: 2,
				parent: expect.objectContaining({ level: 1 }),
			},
			{
				property: '1',
				value: root[1]![1],
				level: 2,
				parent: expect.objectContaining({ level: 1 }),
			},
			{
				property: '2',
				value: root[2],
				level: 1,
				parent: expect.objectContaining({ level: 0 }),
			},
		])
	})

	it('works on an object', () => {
		const root = {
			greeting: 'howdy',
			suggestion: {
				activity: 'ho-down',
				location: 'barn',
			},
			addressing: 'partner',
		}
		const collected = withCollector(visit =>
			traverseObjectDepthFirst(root, visit),
		)
		expect(collected).toMatchObject<TraversalNode[]>([
			{
				property: '',
				value: root,
				level: 0,
				parent: undefined,
			},
			{
				property: 'greeting',
				value: root.greeting,
				level: 1,
				parent: expect.objectContaining({ level: 0 }),
			},
			{
				property: 'suggestion',
				value: root.suggestion,
				level: 1,
				parent: expect.objectContaining({ level: 0 }),
			},
			{
				property: 'activity',
				value: root.suggestion.activity,
				level: 2,
				parent: expect.objectContaining({ level: 1 }),
			},
			{
				property: 'location',
				value: root.suggestion.location,
				level: 2,
				parent: expect.objectContaining({ level: 1 }),
			},
			{
				property: 'addressing',
				value: root.addressing,
				level: 1,
				parent: expect.objectContaining({ level: 0 }),
			},
		])
	})
})

describe('traverseObjectBreadthFirst', () => {
	it('works on a primitive', () => {
		expect(
			withCollector(visit => traverseObjectBreadthFirst('howdy', visit)),
		).toMatchObject<TraversalNode[]>([
			{
				property: '',
				value: 'howdy',
				level: 0,
				parent: undefined,
			},
		])
	})

	it('works on an array', () => {
		const root = ['howdy', ["let's throw", 'a ho-down'], 'partner']
		const collected = withCollector(visit =>
			traverseObjectBreadthFirst(root, visit),
		)
		expect(collected).toMatchObject<TraversalNode[]>([
			{
				property: '',
				value: root,
				level: 0,
				parent: undefined,
			},
			{
				property: '0',
				value: root[0],
				level: 1,
				parent: expect.objectContaining({ level: 0 }),
			},
			{
				property: '1',
				value: root[1],
				level: 1,
				parent: expect.objectContaining({ level: 0 }),
			},

			{
				property: '2',
				value: root[2],
				level: 1,
				parent: expect.objectContaining({ level: 0 }),
			},
			{
				property: '0',
				value: root[1]![0],
				level: 2,
				parent: expect.objectContaining({ level: 1 }),
			},
			{
				property: '1',
				value: root[1]![1],
				level: 2,
				parent: expect.objectContaining({ level: 1 }),
			},
		])
	})

	it('works on an object', () => {
		const root = {
			greeting: 'howdy',
			suggestion: {
				activity: 'ho-down',
				location: 'barn',
			},
			addressing: 'partner',
		}
		const collected = withCollector(visit =>
			traverseObjectBreadthFirst(root, visit),
		)
		expect(collected).toMatchObject<TraversalNode[]>([
			{
				property: '',
				value: root,
				level: 0,
				parent: undefined,
			},
			{
				property: 'greeting',
				value: root.greeting,
				level: 1,
				parent: expect.objectContaining({ level: 0 }),
			},
			{
				property: 'suggestion',
				value: root.suggestion,
				level: 1,
				parent: expect.objectContaining({ level: 0 }),
			},
			{
				property: 'addressing',
				value: root.addressing,
				level: 1,
				parent: expect.objectContaining({ level: 0 }),
			},
			{
				property: 'activity',
				value: root.suggestion.activity,
				level: 2,
				parent: expect.objectContaining({ level: 1 }),
			},
			{
				property: 'location',
				value: root.suggestion.location,
				level: 2,
				parent: expect.objectContaining({ level: 1 }),
			},
		])
	})
})
