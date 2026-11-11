import { describe, expect, it } from 'vitest'
import { onboardingSchema, type OnboardingFormValues } from './schema'

// Example request from the brief.
const valid: OnboardingFormValues = {
  firstName: 'Hello',
  lastName: 'World',
  phone: '+13062776103',
  corporationNumber: '826417395',
}

const firstError = (field: keyof OnboardingFormValues, value: string) => {
  const result = onboardingSchema.safeParse({ ...valid, [field]: value })
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message
}

describe('onboardingSchema', () => {
  it('accepts the example values from the brief', () => {
    expect(onboardingSchema.safeParse(valid).success).toBe(true)
  })

  it.each(['firstName', 'lastName'] as const)('%s treats blank input as missing and is limited to 50 characters', (field) => {
    const label = field === 'firstName' ? 'First name' : 'Last name'

    expect(firstError(field, '   ')).toBe(`${label} is required`)
    expect(firstError(field, 'a'.repeat(50))).toBeUndefined()
    expect(firstError(field, 'a'.repeat(51))).toBe(`${label} must be 50 characters or fewer`)
  })

  it.each(['3062776103', '13062776103', '+1 (306) 277-6103', '+1306277610', '+130627761030'])(
    'rejects badly formatted phone number %s',
    (phone) => {
      expect(firstError('phone', phone)).toBe('Phone number must start with +1 followed by 10 digits')
    },
  )

  it('rejects a correctly formatted non-Canadian number', () => {
    expect(firstError('phone', '+12125551234')).toBe('Phone number must be a valid Canadian number')
  })

  it.each(['12345678', '1234567890', '12345678a'])('rejects corporation number %s', (corporationNumber) => {
    expect(firstError('corporationNumber', corporationNumber)).toBe('Corporation number must be 9 digits')
  })
})
