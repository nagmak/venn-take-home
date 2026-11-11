// Local oxlint rules for test files.
//
// no-fixed-delay: a test must wait for an observable outcome (waitFor,
// findBy*, a gate the test opens), never for a guessed amount of time. Fixed
// waits made tests flaky, or let them pass without testing anything (see
// docs/incidents.md). Flags:
//   - msw's delay(), under any import name or as a namespace member
//   - setTimeout/setInterval with a non-zero delay (a zero-delay timeout only
//     waits for pending promise callbacks to finish, so it's allowed)
//   - setTimeout from timers/promises with a non-zero delay, imported by name
//     or reached through a namespace or default import
//   - scheduler.wait from timers/promises
// It can't follow dynamic imports or values passed through variables, so
// review still checks for fixed waits it misses.

const TIMERS_PROMISES = new Set(['timers/promises', 'node:timers/promises'])
const GLOBAL_TIMERS = new Set(['setTimeout', 'setInterval'])
const GLOBAL_OBJECTS = new Set(['window', 'globalThis', 'global'])

const isZero = (node) => node === undefined || (node.type === 'Literal' && node.value === 0)

const noFixedDelay = {
  meta: {
    type: 'problem',
    messages: {
      fixedDelay:
        'Wait for an observable outcome (waitFor, findBy*, a gate from src/test/gate.ts) instead of a fixed delay.',
    },
  },
  create(context) {
    const mswDelayNames = new Set()
    const mswNamespaces = new Set()
    const promiseTimerNames = new Set()
    const promiseTimerModules = new Set()

    return {
      ImportDeclaration(node) {
        const source = node.source.value
        for (const specifier of node.specifiers) {
          if (source === 'msw') {
            if (specifier.type === 'ImportNamespaceSpecifier') mswNamespaces.add(specifier.local.name)
            else if (specifier.type === 'ImportSpecifier' && specifier.imported.name === 'delay')
              mswDelayNames.add(specifier.local.name)
          } else if (TIMERS_PROMISES.has(source)) {
            if (specifier.type !== 'ImportSpecifier') promiseTimerModules.add(specifier.local.name)
            else if (specifier.imported.name === 'setTimeout') promiseTimerNames.add(specifier.local.name)
            else if (specifier.imported.name === 'scheduler') promiseTimerModules.add(specifier.local.name)
          }
        }
      },
      CallExpression(node) {
        const { callee, arguments: args } = node
        const report = () => context.report({ node, messageId: 'fixedDelay' })

        if (callee.type === 'Identifier') {
          if (mswDelayNames.has(callee.name)) return report()
          if (promiseTimerNames.has(callee.name)) return isZero(args[0]) ? undefined : report()
          if (GLOBAL_TIMERS.has(callee.name)) return isZero(args[1]) ? undefined : report()
          return
        }

        if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier') {
          const object = callee.object.name
          const property = callee.computed ? callee.property.value : callee.property.name
          if (mswNamespaces.has(object) && property === 'delay') return report()
          if (GLOBAL_OBJECTS.has(object) && GLOBAL_TIMERS.has(property) && !isZero(args[1])) return report()
          if (promiseTimerModules.has(object)) {
            if (property === 'wait') return report()
            if (property === 'setTimeout' && !isZero(args[0])) return report()
          }
        }
        // timers.scheduler.wait(...)
        if (
          callee.type === 'MemberExpression' &&
          callee.object.type === 'MemberExpression' &&
          callee.object.object.type === 'Identifier' &&
          promiseTimerModules.has(callee.object.object.name) &&
          callee.property.name === 'wait'
        )
          return report()
      },
    }
  },
}

export default {
  meta: { name: 'test-rules' },
  rules: { 'no-fixed-delay': noFixedDelay },
}
