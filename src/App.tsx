import { StepIndicator } from './components/StepIndicator/StepIndicator'
import { OnboardingForm } from './features/onboarding/components/OnboardingForm'
import styles from './App.module.css'

export default function App() {
  return (
    <main className={styles.page}>
      <StepIndicator current={1} total={5} />
      <OnboardingForm />
    </main>
  )
}
