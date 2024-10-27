import typescriptEslint from '@typescript-eslint/eslint-plugin'
import prettier from 'eslint-plugin-prettier'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
})

export default [
	...compat.extends(
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:prettier/recommended',
	),
	{
		plugins: {
			'@typescript-eslint': typescriptEslint,
			prettier,
		},

		languageOptions: {
			globals: {
				...Object.fromEntries(
					Object.entries(globals.browser).map(([key]) => [key, 'off']),
				),
				...globals.node,
				Atomics: 'readonly',
				SharedArrayBuffer: 'readonly',
			},

			parser: tsParser,
			ecmaVersion: 2018,
			sourceType: 'module',
		},

		rules: {
			'comma-dangle': ['error', 'always-multiline'],

			indent: [
				'off',
				'tab',
				{
					flatTernaryExpressions: true,
					offsetTernaryExpressions: false,
				},
			],

			'max-len': [
				'error',
				{
					code: 100,
					comments: 120,
				},
			],

			'function-paren-newline': ['error', 'consistent'],
			'linebreak-style': ['error', 'unix'],

			quotes: [
				'error',
				'single',
				{
					avoidEscape: true,
				},
			],

			'no-unused-vars': [
				'error',
				{
					varsIgnorePattern: '^[A-Z]|^_',
					args: 'none',
				},
			],

			eqeqeq: ['error', 'smart'],
			semi: 'off',

			'@typescript-eslint/array-type': [
				'error',
				{
					default: 'array-simple',
				},
			],
		},
	},
]
