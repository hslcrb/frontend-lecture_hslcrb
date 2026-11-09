import type { D1 } from './free-db'
import type { VerifiedIdentity } from './auth'
import { roleRank, type CmsRole } from './roles'

export const TEACHER_COOKIE = '__Host-FLTeacher'
export const SESSION_SECONDS = 12 * 60 * 60
const RESET_SECONDS = 15 * 60
const CHALLENGE_SECONDS = 10 * 60
const ITERATIONS = 120_000
const CLIENT_SCHEME = 'client_pbkdf2_hmac_v1'
const encoder = new TextEncoder()

export interface TeacherEnv {
  DB: D1
  TEACHER_EMAIL?: string
  OWNER_EMAIL?: string
  AUTH_PEPPER?: string
  EMAIL_FROM?: string
  EMAIL?: { send: (message: {
    from: string; to: string; subject: string; text: string; html: string
  }) => Promise<{ messageId?: string }> }
}
type Credential = {
  salt: string; password_hash: string; hash_iterations: number
  hash_scheme: string; failed_attempts: number; locked_until: number
}
type KdfDetails = {
  scheme: string; salt: string; iterations: number
  ticket?: string
}
const now = () => Math.floor(Date.now() / 1000)

function base64url(bytes: Uint8Array): string {
  let binary = ''
  for (const v of bytes) binary += String.fromCharCode(v)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
function unbase64url(s: string): Uint8Array {
  const binary = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4))
  return Uint8Array.from(binary, c => c.charCodeAt(0))
}
const randomSecret = (length = 32) => base64url(crypto.getRandomValues(new Uint8Array(length)))
async function sha256(value: string): Promise<string> {
  return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))))
}
async function hmac(env: TeacherEnv, message: string): Promise<string> {
  const pepper = env.AUTH_PEPPER
  if (!pepper || !/^[0-9a-f]{64}$/.test(pepper)) throw new Error('ADMIN_AUTH_NOT_CONFIGURED')
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message))))
}
function constantTimeEquals(a: string, b: string): boolean {
  const A = encoder.encode(a), B = encoder.encode(b)
  let diff = A.length ^ B.length
  for (let i = 0; i < Math.max(A.length, B.length); i++) diff |= (A[i] ?? 0) ^ (B[i] ?? 0)
  return diff === 0
}
function validProof(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)
}
function validSalt(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{22}$/.test(value)
}
function challengeText(purpose: 'setup' | 'reset', identity: VerifiedIdentity, salt: string, expires: number) {
  return ['blue-renaissance-kdf-v1', purpose, identity.subject, identity.email.toLowerCase(), salt, expires].join('|')
}
async function issueKdf(env: TeacherEnv, identity: VerifiedIdentity, purpose: 'setup' | 'reset'): Promise<KdfDetails> {
  const salt = randomSecret(16)
  const expires = now() + CHALLENGE_SECONDS
  const signature = await hmac(env, challengeText(purpose, identity, salt, expires))
  return { scheme: CLIENT_SCHEME, salt, iterations: ITERATIONS, ticket: expires + '.' + signature }
}
async function verifyKdfTicket(
  env: TeacherEnv, identity: VerifiedIdentity, purpose: 'setup' | 'reset',
  salt: unknown, ticket: unknown
): Promise<boolean> {
  if (!validSalt(salt) || typeof ticket !== 'string' || ticket.length > 100) return false
  const match = /^(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(ticket)
  if (!match) return false
  const expires = Number(match[1])
  if (expires <= now() || expires > now() + CHALLENGE_SECONDS) return false
  const sig = await hmac(env, challengeText(purpose, identity, salt, expires))
  return constantTimeEquals(sig, match[2])
}
async function verifier(env: TeacherEnv, identity: VerifiedIdentity, proof: string): Promise<string> {
  // The browser runs the expensive, salted 120k PBKDF2. The server stores
  // only a keyed verifier, not the browser's reusable PBKDF2 output.
  return hmac(env, 'blue-renaissance-verifier-v1|' + identity.email.toLowerCase() + '|' + proof)
}
// Compatibility for credentials created before the free-tier fix. Existing
// credentials must not be silently downgraded or overwritten.
async function legacyPbkdf2(password: string, salt: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: unbase64url(salt) as BufferSource },
    key, 256
  )
  return base64url(new Uint8Array(bits))
}
export function teacherMatches(identity: VerifiedIdentity, env: TeacherEnv): boolean {
  const email = identity.email.toLowerCase()
  return [env.OWNER_EMAIL, env.TEACHER_EMAIL].some(v => Boolean(v) && v!.trim().toLowerCase() === email)
}
function cookieToken(request: Request): string | null {
  const match = (request.headers.get('Cookie') ?? '').match(/(?:^|;\s*)__Host-FLTeacher=([^;]+)/)
  return match && /^[A-Za-z0-9_-]{40,50}$/.test(match[1]) ? match[1] : null
}
function sessionCookie(token: string, age: number): string {
  return TEACHER_COOKIE + '=' + token + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + age
}
export function clearSessionCookie(): string { return sessionCookie('', 0) }
export async function getCredential(env: TeacherEnv, identity: VerifiedIdentity): Promise<Credential | null> {
  return await env.DB.prepare(
    'SELECT salt,password_hash,hash_iterations,hash_scheme,failed_attempts,locked_until ' +
    'FROM lab_teacher_credentials WHERE email=?'
  ).bind(identity.email.toLowerCase()).first<Credential>()
}
export async function validTeacherSession(
  req: Request, env: TeacherEnv, identity: VerifiedIdentity, role: CmsRole
): Promise<boolean> {
  if (role === 'student') return false
  const token = cookieToken(req)
  if (!token) return false
  const stored = await env.DB.prepare(
    'SELECT session_hash FROM lab_teacher_sessions ' +
    'WHERE session_hash=? AND email=? AND access_subject=? AND expires_at>?'
  ).bind(await sha256(token), identity.email.toLowerCase(), identity.subject, now()).first()
  return Boolean(stored)
}
async function makeSession(env: TeacherEnv, identity: VerifiedIdentity): Promise<string> {
  const token = randomSecret()
  await env.DB.prepare(
    'INSERT INTO lab_teacher_sessions(session_hash,email,access_subject,created_at,expires_at) VALUES(?,?,?,?,?)'
  ).bind(await sha256(token), identity.email.toLowerCase(), identity.subject, now(), now() + SESSION_SECONDS).run()
  return sessionCookie(token, SESSION_SECONDS)
}
export interface TeacherActionResult { body: Record<string, unknown>; status: number; cookie?: string }
const success = (body: Record<string, unknown>, cookie?: string): TeacherActionResult =>
  ({ body, status: 200, cookie })
const fail = (message: string, status = 400): TeacherActionResult => ({ body: { error: message }, status })
function isSameOriginJson(req: Request, url: URL) {
  return req.headers.get('Origin') === url.origin &&
    req.headers.get('X-Frontend-Lab') === 'teacher-auth' &&
    Boolean(req.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))
}
export async function handleTeacherAction(
  req: Request, env: TeacherEnv, identity: VerifiedIdentity, role: CmsRole
): Promise<TeacherActionResult> {
  if (role === 'student') return fail('관리자로 승인된 계정만 이용할 수 있습니다.', 403)
  const url = new URL(req.url)
  try {
    if (req.method === 'GET' && url.pathname === '/api/teacher/status') {
      const cred = await getCredential(env, identity)
      const authenticated = Boolean(cred) && await validTeacherSession(req, env, identity, role)
      const kdf: KdfDetails | null = cred
        ? cred.hash_scheme === CLIENT_SCHEME
          ? { scheme: CLIENT_SCHEME, salt: cred.salt, iterations: cred.hash_iterations }
          : { scheme: 'server_pbkdf2_v1', salt: cred.salt, iterations: cred.hash_iterations }
        : await issueKdf(env, identity, 'setup')
      return success({
        teacher: role === 'teacher', role, rank: roleRank(role), email: identity.email,
        configured: !!cred, authenticated, resetEmail: identity.email, kdf
      })
    }
    if (req.method === 'GET' && url.pathname === '/api/teacher/kdf') {
      if (url.searchParams.get('purpose') !== 'reset') return fail('지원하지 않는 인증 요청입니다.', 400)
      if (!await getCredential(env, identity)) return fail('설정된 관리자 비밀번호가 없습니다.', 409)
      return success({ kdf: await issueKdf(env, identity, 'reset') })
    }
    if (req.method !== 'POST') return fail('지원하지 않는 요청입니다.', 405)
    if (!isSameOriginJson(req, url)) return fail('잘못된 요청 출처입니다.', 403)
    const raw = await req.text()
    if (raw.length > 1200) return fail('입력 길이를 초과했습니다.', 413)
    let payload: Record<string, unknown>
    try {
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw Error()
      payload = parsed
    } catch { return fail('JSON 형식이 잘못되었습니다.') }
    const action = url.pathname
    const cred = await getCredential(env, identity)

    if (action === '/api/teacher/setup') {
      if (cred) return fail('관리자 비밀번호가 이미 설정되어 있습니다.', 409)
      if (!validProof(payload.proof) || !await verifyKdfTicket(env, identity, 'setup', payload.salt, payload.ticket))
        return fail('인증 정보가 만료되었습니다. 새로고침 후 다시 설정해 주세요.', 410)
      const hash = await verifier(env, identity, payload.proof)
      await env.DB.prepare(
        'INSERT INTO lab_teacher_credentials(email,salt,password_hash,hash_iterations,hash_scheme) VALUES(?,?,?,?,?)'
      ).bind(identity.email.toLowerCase(), payload.salt, hash, ITERATIONS, CLIENT_SCHEME).run()
      return success({ ok: true, configured: true }, await makeSession(env, identity))
    }
    if (action === '/api/teacher/login') {
      if (!cred) return fail('먼저 관리자 비밀번호를 설정해 주세요.', 409)
      if (cred.locked_until > now()) return fail('로그인 시도가 많아 15분간 잠겼습니다.', 429)
      let valid = false
      if (cred.hash_scheme === CLIENT_SCHEME) {
        if (!validProof(payload.proof)) return fail('비밀번호를 입력해 주세요.', 400)
        valid = constantTimeEquals(await verifier(env, identity, payload.proof), cred.password_hash)
      } else if (typeof payload.password === 'string' && payload.password.length <= 256) {
        valid = constantTimeEquals(
          await legacyPbkdf2(payload.password, cred.salt, cred.hash_iterations), cred.password_hash
        )
      } else return fail('비밀번호를 입력해 주세요.', 400)
      if (!valid) {
        const count = cred.failed_attempts + 1
        await env.DB.prepare(
          'UPDATE lab_teacher_credentials SET failed_attempts=?,locked_until=? WHERE email=?'
        ).bind(count >= 5 ? 0 : count, count >= 5 ? now() + 900 : 0, identity.email.toLowerCase()).run()
        return fail('비밀번호가 올바르지 않습니다.', 401)
      }
      await env.DB.prepare(
        'UPDATE lab_teacher_credentials SET failed_attempts=0,locked_until=0 WHERE email=?'
      ).bind(identity.email.toLowerCase()).run()
      return success({ ok: true, authenticated: true }, await makeSession(env, identity))
    }
    if (action === '/api/teacher/logout') {
      const token = cookieToken(req)
      if (token) await env.DB.prepare(
        'DELETE FROM lab_teacher_sessions WHERE session_hash=? AND email=?'
      ).bind(await sha256(token), identity.email.toLowerCase()).run()
      return success({ ok: true }, clearSessionCookie())
    }
    if (action === '/api/teacher/reset/request') {
      if (!cred) return fail('비밀번호가 아직 설정되지 않았습니다.', 409)
      if (!env.EMAIL) return fail('메일 발송 설정이 준비되지 않았습니다.', 503)
      const latest = await env.DB.prepare(
        'SELECT created_at FROM lab_teacher_reset_tokens WHERE email=? ORDER BY created_at DESC LIMIT 1'
      ).bind(identity.email.toLowerCase()).first<{ created_at: number }>()
      if (latest && latest.created_at > now() - 300)
        return success({ ok: true, message: '5분 이내 이미 재설정 메일을 요청했습니다.' })
      const token = randomSecret()
      const digest = await sha256(token)
      await env.DB.prepare(
        'INSERT INTO lab_teacher_reset_tokens(token_hash,email,created_at,expires_at) VALUES(?,?,?,?)'
      ).bind(digest, identity.email.toLowerCase(), now(), now() + RESET_SECONDS).run()
      const urlOfReset = url.origin + '/admin#reset=' + token
      try {
        await env.EMAIL.send({
          from: env.EMAIL_FROM?.trim() || 'no-reply@rhee.life',
          to: identity.email,
          subject: 'Blue Renaissance CMS 관리자 비밀번호 재설정',
          text: '관리자 비밀번호 재설정 링크:\n\n' + urlOfReset +
            '\n\n15분 동안 한 번만 사용할 수 있습니다. 요청하지 않았다면 무시하세요.',
          html: '<p>Blue Renaissance CMS 비밀번호 재설정</p><p><a href="' +
            urlOfReset + '">비밀번호 재설정</a></p><p>15분 동안 한 번만 사용할 수 있습니다.</p>'
        })
      } catch (err) {
        await env.DB.prepare('DELETE FROM lab_teacher_reset_tokens WHERE token_hash=?').bind(digest).run()
        console.error('Admin reset email failed:', err instanceof Error ? err.name : 'unknown')
        return fail('메일 발송이 불가능합니다. 수신 주소 인증 상태를 확인해 주세요.', 503)
      }
      return success({ ok: true, message: '관리자 이메일로 재설정 링크를 보냈습니다.' })
    }
    if (action === '/api/teacher/reset/confirm') {
      if (!cred) return fail('관리자 비밀번호가 아직 설정되지 않았습니다.', 409)
      if (typeof payload.token !== 'string' || !/^[A-Za-z0-9_-]{40,50}$/.test(payload.token))
        return fail('재설정 링크가 올바르지 않습니다.')
      if (!validProof(payload.proof) ||
        !await verifyKdfTicket(env, identity, 'reset', payload.salt, payload.ticket))
        return fail('새 비밀번호 인증이 만료되었습니다. 다시 시도해 주세요.', 410)
      const tokenHash = await sha256(payload.token)
      const row = await env.DB.prepare(
        'SELECT token_hash FROM lab_teacher_reset_tokens ' +
        'WHERE token_hash=? AND email=? AND used_at IS NULL AND expires_at>?'
      ).bind(tokenHash, identity.email.toLowerCase(), now()).first()
      if (!row) return fail('재설정 링크가 만료되었거나 이미 사용되었습니다.', 410)
      const hash = await verifier(env, identity, payload.proof)
      await env.DB.batch([
        env.DB.prepare(
          "UPDATE lab_teacher_credentials SET salt=?,password_hash=?,hash_iterations=?,hash_scheme=?," +
          "updated_at=?,failed_attempts=0,locked_until=0 WHERE email=?"
        ).bind(payload.salt, hash, ITERATIONS, CLIENT_SCHEME, now(), identity.email.toLowerCase()),
        env.DB.prepare(
          'UPDATE lab_teacher_reset_tokens SET used_at=? WHERE token_hash=? AND used_at IS NULL'
        ).bind(now(), tokenHash),
        env.DB.prepare('DELETE FROM lab_teacher_sessions WHERE email=?').bind(identity.email.toLowerCase())
      ])
      return success({ ok: true, authenticated: true }, await makeSession(env, identity))
    }
    return fail('알 수 없는 관리자 인증 요청입니다.', 404)
  } catch (err) {
    // Never log password, KDF proof, session token, salt or reset URL.
    const type = err instanceof Error ? err.name : 'Unknown'
    console.error('Blue Renaissance admin authentication failed:', {route:url.pathname, type})
    return fail(type === 'D1_ERROR' ? '데이터베이스 작업을 완료하지 못했습니다.' :
      '인증 처리에 실패했습니다. 다시 시도해 주세요.', 503)
  }
}
