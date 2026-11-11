import { useId, type ComponentProps } from 'react'
import styles from './TextField.module.css'

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string
  error?: string
  /** Non-error help text, e.g. "Checking…". An error takes its place. */
  hint?: string
}

export function TextField({ label, error, hint, className, ...inputProps }: TextFieldProps) {
  const inputId = useId()
  const messageId = `${inputId}-message`
  const message = error || hint

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        {...inputProps}
        id={inputId}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
      />
      {/* Always mounted so screen readers announce messages as they appear. */}
      <p id={messageId} className={error ? styles.error : styles.hint} aria-live="polite">
        {message}
      </p>
    </div>
  )
}
