import { useId, type ComponentProps } from 'react'
import styles from './TextField.module.css'

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string
  error?: string
}

export function TextField({ label, error, className, ...inputProps }: TextFieldProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`

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
        aria-describedby={error ? errorId : undefined}
      />
      {/* Always mounted so screen readers announce errors as they appear. */}
      <p id={errorId} className={styles.error} aria-live="polite">
        {error}
      </p>
    </div>
  )
}
