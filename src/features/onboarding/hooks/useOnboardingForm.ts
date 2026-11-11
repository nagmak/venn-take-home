import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { corporationNumberQuery } from '../corporationNumberQuery'
import { onboardingSchema, type OnboardingFormValues } from '../onboardingSchema'

const UNAVAILABLE_MESSAGE = 'Could not verify corporation number. Please try again.'

const DEFAULT_VALUES: OnboardingFormValues = {
  firstName: '',
  lastName: '',
  phone: '',
  corporationNumber: '',
}

const schemaResolver = zodResolver(onboardingSchema)

/** Resolves to the error message for a corporation number, or undefined if it's valid. */
async function checkCorporationNumber(queryClient: QueryClient, value: string) {
  try {
    const result = await queryClient.fetchQuery(corporationNumberQuery(value))
    return result.valid ? undefined : result.message
  } catch {
    // Never treat an unverified number as valid.
    return UNAVAILABLE_MESSAGE
  }
}

export function useOnboardingForm() {
  const queryClient = useQueryClient()

  // Runs the zod schema, then checks the corporation number with the API, but
  // only when that field is being validated (its blur, or submit) and its
  // format is already valid.
  const resolver = useMemo<Resolver<OnboardingFormValues>>(
    () => async (liveValues, context, options) => {
      // react-hook-form passes its live values object. Copy it, so the number
      // checked is the number parsed and submitted even if a field changes
      // during the check.
      const values = { ...liveValues }
      const result = await schemaResolver(values, context, options)
      if (!options.names?.includes('corporationNumber') || result.errors.corporationNumber) return result

      const message = await checkCorporationNumber(queryClient, values.corporationNumber)
      if (!message) return result
      return {
        values: {},
        errors: { ...result.errors, corporationNumber: { type: 'api', message } },
      }
    },
    [queryClient],
  )

  return useForm<OnboardingFormValues>({
    resolver,
    mode: 'onBlur',
    // Re-validate on blur after a failed submit too, so the API isn't called per keystroke.
    reValidateMode: 'onBlur',
    defaultValues: DEFAULT_VALUES,
  })
}
