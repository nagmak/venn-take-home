import type { ComponentProps } from 'react'
import styles from './Button.module.css'

type ButtonProps = ComponentProps<'button'>

// Defaults to type="button" so a button never submits a form unless asked to.
export function Button({ type = 'button', className, ...buttonProps }: ButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      className={[styles.button, className].filter(Boolean).join(' ')}
    />
  )
}
