/** A promise the test resolves when it chooses, to hold a mocked response. */
export function createGate() {
  let open!: () => void
  const opened = new Promise<void>((resolve) => (open = resolve))
  return { open, opened }
}
