const FIELDS = [
  { name: 'firstName', label: 'First Name', type: 'text' },
  { name: 'lastName', label: 'Last Name', type: 'text' },
  { name: 'phone', label: 'Phone Number', type: 'tel' },
  { name: 'corporationNumber', label: 'Corporation Number', type: 'text' },
] as const

export function OnboardingForm() {
  return (
    <form aria-labelledby="onboarding-form-title">
      <h1 id="onboarding-form-title">Onboarding Form</h1>
      {FIELDS.map(({ name, label, type }) => (
        <div key={name}>
          <label htmlFor={name}>{label}</label>
          <input id={name} name={name} type={type} />
        </div>
      ))}
    </form>
  )
}
