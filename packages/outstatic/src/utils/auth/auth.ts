import { Session } from '@/types'
import * as Iron from '@hapi/iron'

import { cookies } from 'next/headers'

export type LoginSession = {
  user: {
    name: string
    login: string
    email: string
    image: string
  }
  access_token: string
  expires: Date
}

export type Request = {
  cookies: Partial<{
    [key: string]: string
  }>
  headers: {
    cookie: string
  }
}

export const TOKEN_NAME = 'ost_token'

export const MAX_AGE = 60 * 60 * 24 * 30 // 30 days hours

const TOKEN_SECRET =
  process.env.OST_TOKEN_SECRET || 'l1f3154n4dv3ntur3st4yS7r0n9s3cr3t'

export async function setLoginSession(session: LoginSession) {
  // Create a session object with a max age that we can validate later
  const obj = { ...session }
  const token = await Iron.seal(obj, TOKEN_SECRET, Iron.defaults)
  cookies().set(TOKEN_NAME, token, {
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax'
  })

  return true
}

export async function getLoginSession(): Promise<Session | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(TOKEN_NAME)?.value
  if (!token) return null

  try {
    const session = await Iron.unseal(token, TOKEN_SECRET, Iron.defaults)
    const expires = session.expires
    // Validate the expiration date of the session
    if (Date.now() > expires) {
      throw new Error('Session expired')
    }

    return session
  } catch {
    return null
  }
}
