# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## [1.1.0] - 2022-07-04
### Added
- CHANGELOG.md
- Performance test for empty array schema.

### Changed
- Narrowing with an empty array schema infers `Array<unknown>` instead of `Array<never>`.
  - A never-array is never useful.
  - This can also be used to improve performance for input arrays that may be large and whose contents don't need to be checked immediately.

### Fixed
- `Pong` assertion in README.

## [1.0.1] - 2022-03-09
### Changed
- Reduced package size by adding `"files"` to `package.json`.
