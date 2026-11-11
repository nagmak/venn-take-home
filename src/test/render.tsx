import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, waitFor } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { expect } from 'vitest'
import { corporationNumberQuery } from '../features/onboarding/corporationNumberQuery'

/**
 * A fresh TanStack Query client and a wrapper that provides it, so no cached
 * answer leaks between tests. Options come from the query definitions, as in
 * the app.
 */
export function createQueryClientWrapper() {
  const queryClient = new QueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

/** Renders `ui` with a fresh TanStack Query client. */
export function renderWithQueryClient(ui: ReactElement) {
  const { queryClient, wrapper } = createQueryClientWrapper()
  const rendered = render(ui, { wrapper })

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
