import type { ComponentProps } from 'react'
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
import { useOnboardingSubmit } from '../hooks/useOnboardingSubmit'

type FieldConfig = {
  name: keyof OnboardingFormValues
  label: string
  type: 'text' | 'tel'
  fullWidth?: boolean
  maxLength?: number
  autoComplete?: string
  inputMode?: ComponentProps<'input'>['inputMode']
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
    inputMode: 'tel',
  },
  {
    name: 'corporationNumber',
    label: 'Corporation Number',
    type: 'text',
    fullWidth: true,
    maxLength: CORPORATION_NUMBER_LENGTH,
    inputMode: 'numeric',
  },
]

const SUCCESS_MESSAGE = 'Thanks! Your details have been submitted.'
const FIX_FIELDS_MESSAGE = 'Please fix the highlighted fields.'

export function OnboardingForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitted, isSubmitSuccessful },
    isCheckingCorporationNumber,
  } = useOnboardingForm()
  const { status, submit } = useOnboardingSubmit()
  // After a submit that failed validation; clears once every field is fixed.
  const showFixMessage = isSubmitted && !isSubmitSuccessful && Object.keys(errors).length > 0

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
        {FIELDS.map(({ name, label, type, fullWidth, maxLength, autoComplete, inputMode }) => {
          const checking = name === 'corporationNumber' && isCheckingCorporationNumber
          return (
            <TextField
              key={name}
              {...register(name)}
              label={label}
              type={type}
              maxLength={maxLength}
              autoComplete={autoComplete}
              inputMode={inputMode}
              error={checking ? undefined : errors[name]?.message}
              hint={checking ? 'Checking…' : undefined}
              className={fullWidth ? styles.fullWidth : undefined}
            />
          )
        })}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          'Submitting…'
        ) : (
          <>
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
          </>
        )}
      </Button>
      {/* Always mounted so screen readers announce results as they appear. */}
      <p className={styles.submitError} role="alert">
        {showFixMessage ? FIX_FIELDS_MESSAGE : status.state === 'error' ? status.message : undefined}
      </p>
      <p className={styles.submitSuccess} role="status">
        {status.state === 'success' ? SUCCESS_MESSAGE : undefined}
      </p>
    </form>
  )
}
