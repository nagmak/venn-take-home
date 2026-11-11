import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, waitFor } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { expect } from 'vitest'
import { corporationNumberQuery } from '../features/onboarding/corporationNumberQuery'

/** A fresh TanStack Query client per test, so no cached answer leaks between tests. */
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

  /** Waits until the app has finished handling the API's answer for `number`. */
  const waitForCheckHandled = async (number: string) => {
    const { queryKey } = corporationNumberQuery(number)
    if (!queryClient.getQueryCache().find({ queryKey, exact: true })) {
      throw new Error(`waitForCheckHandled: the app never checked ${number}`)
    }
    await waitFor(() => expect(queryClient.isFetching({ queryKey, exact: true })).toBe(0))
    // Let the code awaiting the answer finish.
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
  }

  return { ...rendered, waitForCheckHandled }
}
