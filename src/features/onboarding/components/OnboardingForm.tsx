import { Button } from '../../../components/Button/Button'
import { TextField } from '../../../components/TextField/TextField'
import styles from './OnboardingForm.module.css'
import {
  CORPORATION_NUMBER_LENGTH,
  NAME_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  type OnboardingFormValues,
} from '../onboardingSchema'
import { useOnboardingForm } from '../hooks/useOnboardingForm'
import { useOnboardingSubmit, type SubmitStatus } from '../hooks/useOnboardingSubmit'

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

const SUCCESS_MESSAGE = 'Thanks! Your details have been submitted.'

const statusMessage = (status: SubmitStatus) =>
  status.state === 'success' ? SUCCESS_MESSAGE : status.state === 'error' ? status.message : undefined

export function OnboardingForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    corporationStatus,
  } = useOnboardingForm()
  const { status, submit } = useOnboardingSubmit()

  return (
    <form
      className={styles.card}
      aria-labelledby="onboarding-form-title"
      onSubmit={handleSubmit(submit)}
    >
      <h1 id="onboarding-form-title" className={styles.title}>
        Onboarding Form
      </h1>
      <div className={styles.fields}>
        {FIELDS.map(({ name, label, type, fullWidth, maxLength, autoComplete }) => {
          const checking = name === 'corporationNumber' && corporationStatus === 'checking'
          return (
            <TextField
              key={name}
              {...register(name)}
              label={label}
              type={type}
              maxLength={maxLength}
              autoComplete={autoComplete}
              error={checking ? undefined : errors[name]?.message}
              hint={checking ? 'Checking…' : undefined}
              className={fullWidth ? styles.fullWidth : undefined}
            />
          )
        })}
      </div>
      <Button type="submit" disabled={isSubmitting}>
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
      {/* Always mounted so screen readers announce the result when it appears. */}
      <p
        className={status.state === 'error' ? styles.submitError : styles.submitSuccess}
        role="status"
      >
        {statusMessage(status)}
      </p>
    </form>
  )
}
