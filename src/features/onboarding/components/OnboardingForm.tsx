import { Button } from '../../../components/Button/Button'
import { TextField } from '../../../components/TextField/TextField'
import styles from './OnboardingForm.module.css'
import {
  CORPORATION_NUMBER_LENGTH,
  NAME_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  type OnboardingFormValues,
} from '../schema'
import { useOnboardingForm } from '../hooks/useOnboardingForm'

type FieldConfig = {
  name: keyof OnboardingFormValues
  label: string
  type: 'text' | 'tel'
  fullWidth?: boolean
  maxLength?: number
  autoComplete?: string
}

const FIELDS: readonly FieldConfig[] = [
  {
    name: 'firstName',
    label: 'First Name',
    type: 'text',
    maxLength: NAME_MAX_LENGTH,
    autoComplete: 'given-name',
  },
  {
    name: 'lastName',
    label: 'Last Name',
    type: 'text',
    maxLength: NAME_MAX_LENGTH,
    autoComplete: 'family-name',
  },
  {
    name: 'phone',
    label: 'Phone Number',
    type: 'tel',
    fullWidth: true,
    maxLength: PHONE_MAX_LENGTH,
    autoComplete: 'tel',
  },
  {
    name: 'corporationNumber',
    label: 'Corporation Number',
    type: 'text',
    fullWidth: true,
    maxLength: CORPORATION_NUMBER_LENGTH,
  },
]

export function OnboardingForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useOnboardingForm()

  return (
    <form
      className={styles.card}
      aria-labelledby="onboarding-form-title"
      // Validates every field and shows errors; sending to the API comes next.
      onSubmit={handleSubmit(() => undefined)}
    >
      <h1 id="onboarding-form-title" className={styles.title}>
        Onboarding Form
      </h1>
      <div className={styles.fields}>
        {FIELDS.map(({ name, label, type, fullWidth, maxLength, autoComplete }) => (
          <TextField
            key={name}
            {...register(name)}
            label={label}
            type={type}
            maxLength={maxLength}
            autoComplete={autoComplete}
            error={errors[name]?.message}
            className={fullWidth ? styles.fullWidth : undefined}
          />
        ))}
      </div>
      <Button type="submit">
        Submit
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Button>
    </form>
  )
}
