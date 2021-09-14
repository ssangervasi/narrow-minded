// https://kulshekhar.github.io/ts-jest/user/config/
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testPathIgnorePatterns: ['/dist/'],
	timers: 'modern',
	moduleNameMapper: {
		'^~/(.*)$': '<rootDir>/src/$1',
	},
}
