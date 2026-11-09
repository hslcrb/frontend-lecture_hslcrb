import { createRemoteJWKSet, jwtVerify } from 'jose'

export interface VerifiedIdentity { subject: string; email: string }
export interface AccessEnv { CF_ACCESS_TEAM_DOMAIN?: string; CF_ACCESS_AUD?: string }
const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

/** Verify signed Access identity; never trust the unverified email HTTP header. */
export async function verifyAccess(request: Request, env: AccessEnv): Promise<VerifiedIdentity> {
  const domain = env.CF_ACCESS_TEAM_DOMAIN?.trim() ?? ''
  const aud = env.CF_ACCESS_AUD?.trim() ?? ''
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain) || !aud) {
    throw new Error('Access configuration missing')
  }
  const token = request.headers.get('Cf-Access-Jwt-Assertion')
  if (!token) throw new Error('Access JWT missing')
  const issuer = 'https://' + domain
  let keys = keySets.get(domain)
  if (!keys) {
    keys = createRemoteJWKSet(new URL(issuer + '/cdn-cgi/access/certs'))
    keySets.set(domain, keys)
  }
  const { payload } = await jwtVerify(token, keys, {
    issuer, audience: aud, algorithms: ['RS256'],
  })
  if (typeof payload.sub !== 'string' || !payload.sub ||
      typeof payload.email !== 'string' || !payload.email) {
    throw new Error('Access JWT is missing subject or email')
  }
  return { subject: payload.sub, email: payload.email }
}
