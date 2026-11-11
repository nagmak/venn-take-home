import { useIsFetching } from '@tanstack/react-query'
import type { ComponentProps } from 'react'
import { useWatch, type Control } from 'react-hook-form'
import { TextField } from '../../../components/TextField/TextField'
import { corporationNumberQuery } from '../corporationNumberQuery'
import type { OnboardingFormValues } from '../onboardingSchema'

type CorporationNumberFieldProps = ComponentProps<typeof TextField> & {
  control: Control<OnboardingFormValues>
}

/**
 * The corporation number field. It shows "Checking…" while the number it
 * currently holds is being checked. It watches its own value, so typing
 * re-renders only this field, not the whole form.
 */
export function CorporationNumberField({ control, error, ...props }: CorporationNumberFieldProps) {
  const value = useWatch({ control, name: 'corporationNumber' })
  const checking = useIsFetching({ queryKey: corporationNumberQuery(value).queryKey, exact: true }) > 0

  return <TextField {...props} error={checking ? undefined : error} hint={checking ? 'Checking…' : undefined} />
}
