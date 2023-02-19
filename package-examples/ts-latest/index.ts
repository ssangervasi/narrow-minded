import fs from 'fs'

import { narrow, Guard } from 'narrow-minded'

const main = () => {
	const [inputPath] = process.argv.slice(-1)
	const inputStr = fs.readFileSync(inputPath).toString()

	const parsed = parse(inputStr)

	if (!narrow(['object'], parsed)) {
		console.error('Invalid JSON')
		process.exit(1)
	}

	const results = parsed.map(check)

	console.log(results.join('\n--\n'))
}

interface Animal {
	type: 'animal'
	legs: number
	name: string
}
const AnimalGuard = new Guard(
	(u): u is Animal => narrow({ type: 'string' }, u) && u.type === 'animal',
)

const parse = (raw: string): unknown => {
	try {
		return JSON.parse(raw)
	} catch {
		return null
	}
}

const check = (parsed: unknown): string => {
	if (AnimalGuard.satisfied(parsed)) {
		return [
			'AnimalGuard satisfied',
			`name: ${parsed.name}`,
			`legs: ${parsed.legs}`,
		].join('\n')
	}

	if (narrow({ content: 'string', sentAt: 'number' }, parsed)) {
		const sentAt: number = parsed.sentAt
		const sentDate = new Date(sentAt)

		return [
			'Narrowed',
			`content: ${parsed.content}`,
			`sentAt to Date: ${sentDate}`,
		].join('\n')
	}

	if (narrow({ type: 'string' }, parsed)) {
		return `Narrowed type to a string: ${parsed.type}`
	}

	return 'Did not narrow.'
}

main()
