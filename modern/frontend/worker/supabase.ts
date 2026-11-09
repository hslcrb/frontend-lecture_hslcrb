import type { VerifiedIdentity } from './auth'

export interface SupabaseEnv { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string }
export interface Student { access_subject: string; email: string; student_name: string }

function makeURL(env: SupabaseEnv): URL {
  const base = env.SUPABASE_URL?.trim() || ''
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(base)) {
    throw new Error('Supabase URL configuration missing')
  }
  return new URL('/rest/v1/frontend_lab_students', base)
}
function makeHeaders(env: SupabaseEnv): Record<string, string> {
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Supabase secret configuration missing')
  return { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }
}
export async function lookupStudent(env: SupabaseEnv, identity: VerifiedIdentity): Promise<Student | null> {
  const url = makeURL(env)
  url.searchParams.set('select', 'access_subject,email,student_name')
  url.searchParams.set('access_subject', 'eq.' + identity.subject)
  url.searchParams.set('limit', '1')
  const response = await fetch(url, { headers: makeHeaders(env), cache: 'no-store' })
  if (!response.ok) throw new Error('Student lookup returned HTTP ' + response.status)
  const students = await response.json() as Student[]
  return students[0] ?? null
}
export async function saveStudent(env: SupabaseEnv, identity: VerifiedIdentity, name: string): Promise<Student> {
  const url = makeURL(env)
  url.searchParams.set('on_conflict', 'access_subject')
  const response = await fetch(url, {
    method: 'POST',
    headers: { ...makeHeaders(env), Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ access_subject: identity.subject, email: identity.email, student_name: name }),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('Student save returned HTTP ' + response.status)
  const students = await response.json() as Student[]
  if (!students[0]) throw new Error('Supabase returned no student record')
  return students[0]
}
