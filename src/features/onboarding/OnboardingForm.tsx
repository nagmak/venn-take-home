import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import styles from './OnboardingForm.module.css'

const FIELDS = [
  { name: 'firstName', label: 'First Name', type: 'text', fullWidth: false },
  { name: 'lastName', label: 'Last Name', type: 'text', fullWidth: false },
  { name: 'phone', label: 'Phone Number', type: 'tel', fullWidth: true },
  { name: 'corporationNumber', label: 'Corporation Number', type: 'text', fullWidth: true },
] as const

export function OnboardingForm() {
  return (
    <form
      className={styles.card}
      aria-labelledby="onboarding-form-title"
      // Static for now: validation and submission are wired up separately.
      onSubmit={(event) => event.preventDefault()}
    >
      <h1 id="onboarding-form-title" className={styles.title}>
        Onboarding Form
      </h1>
      <div className={styles.fields}>
        {FIELDS.map(({ name, label, type, fullWidth }) => (
          <TextField
            key={name}
            name={name}
            label={label}
            type={type}
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
