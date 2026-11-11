import { parsePhoneNumberFromString } from 'libphonenumber-js/min'
import { z } from 'zod'

export const NAME_MAX_LENGTH = 50

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(NAME_MAX_LENGTH, `${label} must be ${NAME_MAX_LENGTH} characters or fewer`)

// "+1" followed by 10 digits: no spaces, dashes, brackets or other characters.
const PHONE_DIGITS = 10
export const PHONE_MAX_LENGTH = '+1'.length + PHONE_DIGITS
const PHONE_FORMAT = new RegExp(`^\\+1\\d{${PHONE_DIGITS}}$`)

export const CORPORATION_NUMBER_LENGTH = 9

// +1 is shared across North America, so the country check rejects e.g. US numbers.
const isCanadianNumber = (value: string) => {
  const phoneNumber = parsePhoneNumberFromString(value)
  return phoneNumber?.isValid() === true && phoneNumber.country === 'CA'
}

export const onboardingSchema = z.object({
  firstName: name('First name'),
  lastName: name('Last name'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .regex(PHONE_FORMAT, 'Phone number must start with +1 followed by 10 digits')
    .refine(isCanadianNumber, 'Phone number must be a valid Canadian number'),
  // Format only; whether the number exists is checked against the API.
  corporationNumber: z
    .string()
    .trim()
    .min(1, 'Corporation number is required')
    .regex(
      new RegExp(`^\\d{${CORPORATION_NUMBER_LENGTH}}$`),
      `Corporation number must be ${CORPORATION_NUMBER_LENGTH} digits`,
    ),
})

export type OnboardingFormValues = z.infer<typeof onboardingSchema>
