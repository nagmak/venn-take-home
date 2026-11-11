// Local oxlint rules for test files.
//
// no-fixed-delay: a test must wait for an observable outcome (waitFor,
// findBy*, a promise the handler resolves), never sleep for a fixed time.
// Fixed sleeps made tests flaky or pass without testing anything (see
// docs/incidents.md). `delay()` is allowed only inside an MSW handler
// (`http.get(url, async () => { await delay(100) })`), where it simulates a
// slow server rather than waiting on the app.

const isMswHandlerCall = (node) =>
  node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  node.callee.object.type === 'Identifier' &&
  node.callee.object.name === 'http'

const isInsideMswHandler = (node) => {
  for (let current = node.parent; current; current = current.parent) {
    const isFunction =
      current.type === 'ArrowFunctionExpression' || current.type === 'FunctionExpression'
    if (isFunction && current.parent && isMswHandlerCall(current.parent)) return true
  }
  return false
}

const noFixedDelay = {
  meta: {
    type: 'problem',
    messages: {
      fixedDelay:
        'Wait for an observable outcome (waitFor, findBy*, a promise the handler resolves) instead of a fixed delay. delay() is only allowed inside an MSW handler.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const isDelay = node.callee.type === 'Identifier' && node.callee.name === 'delay'
        if (isDelay && !isInsideMswHandler(node)) context.report({ node, messageId: 'fixedDelay' })
      },
    }
  },
}

export default {
  meta: { name: 'test-rules' },
  rules: { 'no-fixed-delay': noFixedDelay },
}
