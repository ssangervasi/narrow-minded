// https://eslint.org/docs/user-guide/configuring
module.exports = {
	env: {
		browser: false,
		node: true,
		es6: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:prettier/recommended',
	],
	globals: {
		Atomics: 'readonly',
		SharedArrayBuffer: 'readonly',
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint', 'prettier'],
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
			},
		],
		'function-paren-newline': ['error', 'consistent'],
		'linebreak-style': ['error', 'unix'],
		quotes: ['error', 'single', { avoidEscape: true }],
		'no-unused-vars': [
			'error',
			// False positive cases:
			{
				// Ignore vars starting with init cap to ignore imported types and interfaces.
				varsIgnorePattern: '^[A-Z]|^_',
				// Ignore function args to ignore constructor parameter properties.
				args: 'none',
			},
		],
		eqeqeq: ['error', 'smart'],
		semi: 'off',
		'@typescript-eslint/semi': ['error', 'never'],
		'@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
		'@typescript-eslint/member-delimiter-style': [
			'error',
			{
				multiline: {
					delimiter: 'none',
					requireLast: true,
				},
				singleline: {
					delimiter: 'semi',
					requireLast: false,
				},
			},
		],
	},
}
