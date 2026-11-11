import styles from './StepIndicator.module.css'

type StepIndicatorProps = {
  current: number
  total: number
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <p className={styles.step}>
      Step {current} of {total}
    </p>
  )
}
