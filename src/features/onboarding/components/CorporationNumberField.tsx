import { useIsFetching } from '@tanstack/react-query'
import type { ComponentProps } from 'react'
import { useWatch, type Control } from 'react-hook-form'
import { TextField } from '../../../components/TextField/TextField'
import { corporationNumberQuery } from '../corporationNumberQuery'
import type { OnboardingFormValues } from '../onboardingSchema'

type CorporationNumberFieldProps = ComponentProps<typeof TextField> & {
  control: Control<OnboardingFormValues>
}

/** Shows "Checking…" while the number in the field is being checked with the API. */
export function CorporationNumberField({ control, error, ...props }: CorporationNumberFieldProps) {
  const value = useWatch({ control, name: 'corporationNumber' })
  const checking = useIsFetching({ queryKey: corporationNumberQuery(value).queryKey, exact: true }) > 0

  return <TextField {...props} error={checking ? undefined : error} hint={checking ? 'Checking…' : undefined} />
}
