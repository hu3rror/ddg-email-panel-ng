import { z } from 'zod'
import { USERNAME_REGEX } from '../constants'

export const requestOtpSchema = z.object({
  username: z
    .string()
    .min(1, { message: 'Duck Address cannot be empty' })
    .regex(USERNAME_REGEX, {
      message: 'Duck Address can only contain letters and numbers',
    }),
})

export type RequestOtpInput = z.infer<typeof requestOtpSchema>