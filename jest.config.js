// https://kulshekhar.github.io/ts-jest/user/config/
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testPathIgnorePatterns: ['/dist/'],
	timers: 'modern',
}
