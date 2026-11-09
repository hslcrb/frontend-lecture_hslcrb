import { verifyAccess, type VerifiedIdentity } from './auth'
import { lookupStudent, saveStudent } from './supabase'
import { loadPublishedContent } from './cms'

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
  CMS_SERVICE?: { fetch: (request: Request) => Promise<Response> }
  CF_ACCESS_TEAM_DOMAIN?: string
  CF_ACCESS_AUD?: string
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}
const safeHeaders = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}
function json(data: unknown, status=200): Response {
  return new Response(JSON.stringify(data), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', ...safeHeaders,
  }})
}
function error(message: string, status: number): Response { return json({error: message}, status) }
function decorate(response: Response, type?: string): Response {
  const headers = new Headers(response.headers)
  Object.entries(safeHeaders).forEach(([key,value]) => headers.set(key,value))
  if (type) headers.set('Content-Type', type)
  return new Response(response.body, { status: response.status, headers })
}
const isHtml = (path: string) =>
  /^\/(?:ai|grid|flex|position|tailwind|javascript|quiz|uiux)\/(?:[\w.-]+\/)*[\w.-]+\.html?$/i.test(path)
const isAsset = (path: string) =>
  /^\/(?:ai|assets|quiz|grid|flex|position|tailwind|javascript|uiux)\/(?:[\w.-]+\/)*[\w.-]+\.(?:css|js)$/i.test(path)
const isBoot = (path: string) => /^\/assets\/[^/]+\.(?:js|css|svg|woff2?)$/i.test(path)

async function student(env: Env, identity: VerifiedIdentity) {
  return lookupStudent(env, identity)
}
async function lesson(req: Request, env: Env, path: string): Promise<Response> {
  try {
    const changed = await loadPublishedContent(env, 'lecture-pages', path)
    if (typeof changed?.html === 'string' && changed.html.trim()) {
      return decorate(new Response(changed.html), 'text/html; charset=utf-8')
    }
  } catch(e) { console.warn('CMS unavailable; using bundled lesson') }
  const fallback = await env.ASSETS.fetch(req)
  if (!fallback.ok) return error('강의 페이지가 없습니다.', 404)
  return decorate(fallback, 'text/html; charset=utf-8')
}
async function asset(req: Request, env: Env, path: string): Promise<Response> {
  try {
    const changed = await loadPublishedContent(env, 'lecture-assets', path)
    if (typeof changed?.source === 'string' && changed.source.trim()) {
      return decorate(new Response(changed.source),
        path.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/css; charset=utf-8')
    }
  } catch(e) { console.warn('CMS unavailable; using bundled asset') }
  const fallback = await env.ASSETS.fetch(req)
  if (!fallback.ok) return error('학습 자료가 없습니다.', 404)
  return decorate(fallback)
}
async function homepage(env: Env): Promise<string> {
  try {
    const edited = await loadPublishedContent(env, 'lecture-pages', '/')
    if (edited?.html) return edited.html
  } catch(e) { console.warn('CMS unavailable; using original homepage') }
  const original = await env.ASSETS.fetch(new Request('https://assets.internal/original-home.html'))
  if (!original.ok) throw new Error('Original homepage not bundled')
  return original.text()
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    if (!['GET','HEAD','POST'].includes(request.method)) return error('허용되지 않는 요청입니다.', 405)
    let identity: VerifiedIdentity
    try {
      identity = await verifyAccess(request, env)
    } catch(e) {
      return error('Google / Cloudflare Access 인증이 필요합니다.', 
        e instanceof Error && e.message.includes('configuration') ? 503 : 401)
    }
    try {
      if (path === '/api/session' && request.method === 'GET') {
        const info = await student(env, identity)
        return json({ authenticated: true, registered: Boolean(info),
          email: identity.email, studentName: info?.student_name ?? null })
      }
      if (path === '/api/profile' && request.method === 'POST') {
        if (request.headers.get('Origin') !== url.origin ||
            request.headers.get('X-Frontend-Lab') !== 'profile' ||
            !request.headers.get('Content-Type')?.startsWith('application/json')) {
          return error('잘못된 등록 요청입니다.', 403)
        }
        const raw = await request.text()
        if (raw.length > 500) return error('입력 길이를 초과했습니다.', 413)
        const payload = (() => { try { return JSON.parse(raw) } catch { return null } })()
        const name = typeof payload?.studentName === 'string'
          ? payload.studentName.trim().replace(/\s+/g,' ') : ''
        if ([...name].length < 2 || [...name].length > 40 || /[<>\u0000-\u001f]/.test(name)) {
          return error('이름은 2~40자로 입력해 주세요.', 400)
        }
        const saved = await saveStudent(env, identity, name)
        return json({ registered: true, studentName: saved.student_name })
      }
      if (path.startsWith('/api/') && path !== '/api/home') return error('API가 없습니다.', 404)
      // React bootstrap code and the registration form must be accessible before the name step.
      if (path === '/' || path === '/index.html' || isBoot(path) || path === '/favicon.ico') {
        if (!['GET','HEAD'].includes(request.method)) return error('허용되지 않는 요청입니다.', 405)
        return decorate(await env.ASSETS.fetch(request))
      }
      const profile = await student(env, identity)
      if (!profile) return error('학생 이름 등록 후 강의를 이용할 수 있습니다.', 403)
      if (path === '/api/home' && request.method === 'GET') return json({ html: await homepage(env) })
      if (!['GET','HEAD'].includes(request.method)) return error('허용되지 않는 요청입니다.', 405)
      if (path.startsWith('/cms-media/')) {
        if (!env.CMS_SERVICE) return error('미디어 저장소가 준비되지 않았습니다.', 503)
        const encoded=path.slice('/cms-media/'.length)
        let decoded: string
        try { decoded=decodeURIComponent(encoded) } catch { return error('잘못된 미디어 경로입니다.', 400) }
        if (!decoded || decoded.includes('..') || !/^[\w.\-\/]+$/.test(decoded)) {
          return error('잘못된 미디어 경로입니다.', 400)
        }
        const uri=new URL('https://cms.internal/api/media/file/'+encoded)
        return decorate(await env.CMS_SERVICE.fetch(new Request(uri,{headers:{Accept:'*/*'}})))
      }
      if (isHtml(path)) return lesson(request, env, path)
      if (isAsset(path)) return asset(request, env, path)
      if (path === '/original-home.html' || path === '/robots.txt') return error('Not found', 404)
      // All fallback assets still require signed Access JWT and student registration.
      return decorate(await env.ASSETS.fetch(request))
    } catch (e) {
      console.error('Frontend Lab error', e instanceof Error ? e.message : 'unknown')
      return error('서버 연결이 준비되지 않았습니다.', 503)
    }
  },
}
