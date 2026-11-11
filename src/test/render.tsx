import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { expect } from 'vitest'
import { corporationNumberQuery } from '../features/onboarding/corporationNumberQuery'

/** Renders with a fresh TanStack Query client, so no cached answer leaks between tests. */
export function renderWithQueryClient(ui: ReactElement) {
  // gcTime: Infinity schedules no cache clean-up timers that would outlive the test.
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } })
  const rendered = render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)

  /**
   * Waits until the app has handled the answer for `number`: its check has
   * settled, and the code awaiting it (the resolver, react-hook-form, React)
   * has finished. Never starts a request of its own.
   */
  const waitForCheckHandled = async (number: string) => {
    const { queryKey } = corporationNumberQuery(number)
    if (!queryClient.getQueryCache().find({ queryKey, exact: true })) {
      throw new Error(`waitForCheckHandled: the app never checked ${number}`)
    }
    await waitFor(() => expect(queryClient.isFetching({ queryKey, exact: true })).toBe(0))
    // Everything awaiting that request runs as microtasks, which all finish
    // before the next task (a zero-delay timeout) starts.
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
  }

  return { ...rendered, waitForCheckHandled }
}
