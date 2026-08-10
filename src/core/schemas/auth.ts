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

export const verifyOtpSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  otp: z
    .string()
    .transform((val) => val.trim().replace(/\s/g, '+'))
    .refine((val) => val.length > 0, {
      message: 'One-time Passphrase cannot be empty',
    }),
})

export const accessTokenLoginSchema = z.object({
  username: z
    .string()
    .min(1, { message: 'Duck Address cannot be empty' })
    .regex(USERNAME_REGEX, {
      message: 'Duck Address can only contain letters and numbers',
    }),
  token: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, {
      message: 'Access Token cannot be empty',
    }),
})

export type RequestOtpInput = z.infer<typeof requestOtpSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type AccessTokenLoginInput = z.infer<typeof accessTokenLoginSchema>