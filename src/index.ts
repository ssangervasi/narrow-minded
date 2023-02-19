/**
 * Ongoing TS hassle: https://github.com/microsoft/TypeScript/issues/50152]
 *
 * > TypeScript will impose Node’s much stricter ESM resolution algorithm on those files, disabling
 *   index-file resolution and extensionless lookups—in fact, the extension the user has to write is
 *   .js, which will be nonsensical for the context, where the runtime module resolver (the bundler)
 *   only ever sees .ts files.
 */
export * from './narrow.js'
export * from './guard.js'
