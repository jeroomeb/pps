// Lets `node --test` load the risk-score modules, which use extensionless
// TypeScript imports. Next.js resolves those; Node does not.
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    try {
      return await nextResolve(specifier, context)
    } catch {
      return nextResolve(`${specifier}.ts`, context)
    }
  }
  return nextResolve(specifier, context)
}
