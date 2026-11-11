import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch, type Resolver } from 'react-hook-form'
import { onboardingSchema, type OnboardingFormValues } from '../onboardingSchema'
import { useCorporationValidation } from './useCorporationValidation'

const DEFAULT_VALUES: OnboardingFormValues = {
  firstName: '',
  lastName: '',
  phone: '',
  corporationNumber: '',
}

const schemaResolver = zodResolver(onboardingSchema)

export function useOnboardingForm() {
  const { check: checkCorporationNumber, isChecking } = useCorporationValidation()

  // Runs the zod schema, then checks the corporation number with the API, but
  // only when that field is being validated (its blur, or submit) and its
  // format is already valid.
  const resolver = useMemo<Resolver<OnboardingFormValues>>(
    () => async (values, context, options) => {
      const result = await schemaResolver(values, context, options)
      if (!options.names?.includes('corporationNumber') || result.errors.corporationNumber) return result

      const message = await checkCorporationNumber(values.corporationNumber)
      if (!message) return result
      return {
        values: {},
        errors: { ...result.errors, corporationNumber: { type: 'api', message } },
      }
    },
    [checkCorporationNumber],
  )

  const form = useForm<OnboardingFormValues>({
    resolver,
    mode: 'onBlur',
    // Re-validate on blur after a failed submit too, so the API isn't called per keystroke.
    reValidateMode: 'onBlur',
    defaultValues: DEFAULT_VALUES,
  })

  // "Checking…" applies only while the field still holds the number being checked.
  const corporationNumber = useWatch({ control: form.control, name: 'corporationNumber' })
  const isCheckingCorporationNumber = isChecking(corporationNumber)

  return { ...form, isCheckingCorporationNumber }
}
