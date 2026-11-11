/**
 * A promise the test opens when it chooses. A mocked response that waits on a
 * gate stays pending until the test says so, instead of for a guessed time.
 */
export function createGate() {
  let open!: () => void
  const opened = new Promise<void>((resolve) => (open = resolve))
  return { open, opened }
}
