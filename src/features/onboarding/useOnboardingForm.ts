import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { onboardingSchema, type OnboardingFormValues } from './schema'

const DEFAULT_VALUES: OnboardingFormValues = {
  firstName: '',
  lastName: '',
  phone: '',
  corporationNumber: '',
}

export function useOnboardingForm() {
  return useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onBlur',
    defaultValues: DEFAULT_VALUES,
  })
}
