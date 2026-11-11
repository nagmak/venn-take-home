import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { corporationNumberQuery } from '../features/onboarding/corporationNumberQuery'

/** Renders with a fresh TanStack Query client, so no cached answer leaks between tests. */
export function renderWithQueryClient(ui: ReactElement) {
  // gcTime: Infinity schedules no cache clean-up timers that would outlive the test.
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } })
  const rendered = render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)

  /**
   * Waits until the app has handled the answer for `number`: the check has
   * settled, and the code awaiting it (the resolver, react-hook-form, React)
   * has finished. Call it only once that number's check has started.
   */
  const waitForCheckHandled = (number: string) =>
    act(async () => {
      // Shares the request already in flight, so it settles with the app's.
      await queryClient.fetchQuery(corporationNumberQuery(number)).catch(() => {})
      // Everything awaiting that request runs as microtasks, which all finish
      // before the next task (a zero-delay timeout) starts.
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

  return { ...rendered, queryClient, waitForCheckHandled }
}
