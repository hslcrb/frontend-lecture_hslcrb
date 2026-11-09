import { verifyAccess, type VerifiedIdentity } from './auth'
import { lookupStudent, saveStudent } from './supabase'
import { findStudent, upsertStudent, getPublished, pathKind, type D1 } from './free-db'
import { isTeacher, handleAdminApi } from './free-cms'

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
  DB: D1
  CF_ACCESS_TEAM_DOMAIN?: string
  CF_ACCESS_AUD?: string
  ADMIN_EMAILS?: string
  STUDENT_STORAGE?: string
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

const headers = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}
const boot = (path: string) => /^\/assets\/[^/]+\.(?:js|css|svg|woff2?)$/i.test(path)
const staticUrl = (request: Request, path: string): Request => {
  const u = new URL(request.url)
  u.pathname = path
  u.search = ''
  return new Request(u.toString(), { method: request.method === 'HEAD' ? 'HEAD' : 'GET' })
}
function reply(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj),{
    status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'},
  })
}
function error(message: string,status: number): Response { return reply({error:message},status) }
function wrap(response:Response, contentType?:string):Response {
  const newHeaders = new Headers(response.headers)
  Object.entries(headers).forEach(([key,value])=>newHeaders.set(key,value))
  if(contentType)newHeaders.set('Content-Type',contentType)
  return new Response(response.body,{status:response.status,headers:newHeaders})
}
async function profile(env: Env, identity: VerifiedIdentity) {
  return env.STUDENT_STORAGE==='supabase'
    ? lookupStudent(env,identity)
    : findStudent(env.DB,identity)
}
async function saveProfile(env:Env,identity:VerifiedIdentity,name:string) {
  return env.STUDENT_STORAGE==='supabase'
    ? saveStudent(env,identity,name)
    : upsertStudent(env.DB,identity,name)
}
async function publishedOrFallback(
  request:Request,env:Env,path:string,
):Promise<Response> {
  const result=await getPublished(env.DB,path)
  if(result.state==='hidden')return error('이 자료는 현재 비공개입니다.',404)
  if(result.state==='published' && result.source!==null) {
    const kind=pathKind(path)
    const contentType=kind==='html'?'text/html; charset=utf-8':
      kind==='css'?'text/css; charset=utf-8':'text/javascript; charset=utf-8'
    return wrap(new Response(request.method==='HEAD'?null:result.source),contentType)
  }
  const asset=await env.ASSETS.fetch(staticUrl(request,path))
  if(!asset.ok)return error('요청한 강의 자료가 없습니다.',404)
  return wrap(asset)
}
async function originalHomepage(request:Request,env:Env):Promise<string> {
  const res=await getPublished(env.DB,'/')
  if(res.state==='hidden')throw new Error('Homepage hidden')
  if(res.state==='published' && res.source!==null)return res.source
  const original=await env.ASSETS.fetch(staticUrl(request,'/original-home.html'))
  if(!original.ok)throw new Error('Original homepage missing')
  return original.text()
}
export default {
  async fetch(request:Request,env:Env):Promise<Response> {
    const url=new URL(request.url)
    const path=url.pathname
    if(!['GET','HEAD','POST'].includes(request.method))
      return error('허용되지 않는 메서드입니다.',405)

    // Deny unauthenticated requests regardless of Access edge policy: fail closed.
    let identity: VerifiedIdentity
    try {
      identity=await verifyAccess(request,env)
    } catch(reason) {
      const notConfigured=reason instanceof Error && reason.message.includes('configuration')
      return error(notConfigured?'로그인 설정이 완료되지 않았습니다.':'Google 로그인 인증이 필요합니다.',
        notConfigured?503:401)
    }

    try {
      if(path.startsWith('/api/admin/'))
        return wrap(await handleAdminApi(request,env,identity))
      if(path==='/admin' || path.startsWith('/admin/')) {
        if(!isTeacher(identity,env))return error('관리자 전용입니다.',403)
        if(request.method!=='GET' && request.method!=='HEAD')return error('메서드 오류',405)
        return wrap(await env.ASSETS.fetch(staticUrl(request,'/index.html')),'text/html; charset=utf-8')
      }

      if(path==='/api/session' && request.method==='GET') {
        const saved=await profile(env,identity)
        return reply({
          authenticated:true,registered:Boolean(saved),email:identity.email,
          studentName:saved?.student_name??null,
          teacher:isTeacher(identity,env),
          storage:env.STUDENT_STORAGE==='supabase'?'supabase':'d1',
        })
      }
      if(path==='/api/profile' && request.method==='POST') {
        if(request.headers.get('Origin')!==url.origin ||
           request.headers.get('X-Frontend-Lab')!=='profile' ||
           !request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))
          return error('유효하지 않은 등록 요청입니다.',403)
        const body=await request.text()
        if(body.length>500)return error('입력 크기가 너무 큽니다.',413)
        let data:unknown
        try { data=JSON.parse(body) } catch {return error('올바른 JSON을 보내주세요.',400)}
        const raw=data && typeof data==='object' && 'studentName' in data
          ? (data as {studentName:unknown}).studentName:undefined
        const name=typeof raw==='string'?raw.trim().replace(/\s+/g,' '):''
        if([...name].length<2 || [...name].length>40 || /[<>\u0000-\u001f]/.test(name))
          return error('이름은 2~40자로 입력해 주세요.',400)
        const saved=await saveProfile(env,identity,name)
        return reply({registered:true,studentName:saved.student_name})
      }
      // The login/onboarding SPA shell must load BEFORE a name is registered.
      if(path==='/' || path==='/index.html' || path==='/favicon.ico' || boot(path)){
        if(request.method!=='GET' && request.method!=='HEAD')return error('메서드 오류',405)
        return wrap(await env.ASSETS.fetch(request))
      }
      if(path.startsWith('/api/') && path!=='/api/home')return error('API를 찾을 수 없습니다.',404)

      // Critical: lesson HTML, quiz JavaScript, styles, image assets, and CMS API
      // all require BOTH signed Access JWT + a separately registered student name.
      const enrolled=await profile(env,identity)
      if(!enrolled)return error('학생 이름을 등록해야 강의를 이용할 수 있습니다.',403)
      if(path==='/api/home' && request.method==='GET')
        return reply({html:await originalHomepage(request,env)})
      if(request.method!=='GET' && request.method!=='HEAD')
        return error('메서드 오류',405)

      if(path==='/original-home.html' || path==='/original-manifest.json' ||
         path==='/robots.txt' || path.startsWith('/cms-media/'))
        return error('자료를 찾을 수 없습니다.',404)
      if(pathKind(path))return publishedOrFallback(request,env,path)
      return wrap(await env.ASSETS.fetch(request))
    } catch(e) {
      console.error('Frontend Lab request failed',e instanceof Error?e.message:'unknown')
      return error('서버 데이터베이스 연결 상태를 확인해 주세요.',503)
    }
  },
}
