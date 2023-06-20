import {
	traverse,
	traverseObjectDepthFirst,
	traverseObjectBreadthFirst,
	TraversalNode,
	TraversalVisit,
} from '~/traverse'

const collect = (
	root: unknown,
	traversal: (root: unknown, visit: TraversalVisit) => void,
) => {
	const collection: TraversalNode[] = []
	traverseObjectDepthFirst(root, node => {
		collection.push(node)
	})
	return collection
}

describe('traverseObjectDepthFirst', () => {
	it('works on a primitive', () => {
		expect(collect('howdy', traverseObjectDepthFirst)).toMatchObject<
			TraversalNode[]
		>([
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
		const collected = collect(root, traverseObjectDepthFirst)
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
		const collected = collect(root, traverseObjectDepthFirst)
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
