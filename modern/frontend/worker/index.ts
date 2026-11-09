import {verifyAccess,type VerifiedIdentity} from './auth'
import {findStudent,upsertStudent,type D1} from './free-db'
import {ensureStudentId} from './learning-db'
import {handleStudentLearningApi,handleTeacherLearningApi} from './learning-api'
import {studentContentApi,adminContentApi} from './native-content'
import {resolveCmsRole,handleRoleAdminApi,canEdit,roleRank,type CmsRole} from './roles'
import {handleTeacherAction,validTeacherSession} from './teacher-auth'

interface Env {
  ASSETS:{fetch:(request:Request)=>Promise<Response>}
  DB:D1
  CF_ACCESS_TEAM_DOMAIN?:string
  CF_ACCESS_AUD?:string
  TEACHER_EMAIL?:string
  OWNER_EMAIL?:string
  AUTH_PEPPER?:string
  EMAIL_FROM?:string
  EMAIL?:{send:(message:{from:string;to:string;subject:string;text:string;html:string})=>Promise<{messageId?:string}>}
}
const securityHeaders={
  'Cache-Control':'private, no-store',
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'X-Frame-Options':'SAMEORIGIN',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
}
function reply(data:unknown,status=200){
  return new Response(JSON.stringify(data),{status,headers:{
    ...securityHeaders,'Content-Type':'application/json; charset=utf-8'
  }})
}
const error=(message:string,status:number)=>reply({error:message},status)
function secure(response:Response,contentType?:string){
  const headers=new Headers(response.headers)
  for(const [key,value] of Object.entries(securityHeaders))headers.set(key,value)
  if(contentType)headers.set('Content-Type',contentType)
  return new Response(response.body,{status:response.status,headers})
}
function fromAsset(request:Request,path:string):Request{
  const target=new URL(request.url)
  target.pathname=path
  target.search=''
  return new Request(target.toString(),{method:request.method==='HEAD'?'HEAD':'GET'})
}
const scriptBundle=/^\/assets\/[a-zA-Z0-9_.-]+\.(?:js|css|woff2?|svg)$/
const contentAsset=/^\/(?:ui\/[a-zA-Z0-9/_.-]+\.svg|assets\/img\/[a-zA-Z0-9/_.-]+\.(?:png|jpg|jpeg|svg|webp|gif))$/
const reactRoute=/^(?:\/|\/index\.html|\/admin\/?|\/me\/?|\/learn\/[a-z0-9-]{3,100}\/?|\/practice\/[a-z0-9-]{3,60}\/?)$/

async function lookupLegacy(url:URL,env:Env){
  const path=url.pathname
  const quiz=await env.DB.prepare('SELECT quiz_slug FROM br_legacy_quiz_map WHERE legacy_path=?')
    .bind(path).first<{quiz_slug:string}>()
  if(quiz)return Response.redirect(url.origin+'/practice/'+quiz.quiz_slug,302)
  const lesson=await env.DB.prepare(
    'SELECT slug FROM br_lessons WHERE source_path=? AND published=1'
  ).bind(path).first<{slug:string}>()
  if(lesson)return Response.redirect(url.origin+'/learn/'+lesson.slug,302)
  return error('강의가 없습니다.',404)
}

export default {
  async fetch(request:Request,env:Env):Promise<Response>{
    const url=new URL(request.url),path=url.pathname
    if(!['GET','HEAD','POST'].includes(request.method))
      return error('지원하지 않는 요청입니다.',405)
    let identity:VerifiedIdentity
    try{identity=await verifyAccess(request,env)}
    catch(reason){
      const unconfigured=reason instanceof Error && reason.message.includes('configuration')
      return error(unconfigured?'로그인 설정이 필요합니다.':'Google 로그인이 필요합니다.',unconfigured?503:401)
    }
    try{
      const protectedRoute=path==='/api/session'||path.startsWith('/api/teacher/')||
        path.startsWith('/api/admin/')||path.startsWith('/admin')
      const role:CmsRole=protectedRoute?await resolveCmsRole(identity,env):'student'
      if(path.startsWith('/api/teacher/')){
        const response=await handleTeacherAction(request,env,identity,role)
        const wrapped=reply(response.body,response.status)
        if(response.cookie)wrapped.headers.set('Set-Cookie',response.cookie)
        return wrapped
      }
      if(path.startsWith('/api/admin/')){
        if(!canEdit(role))return error('관리자 권한이 없습니다.',403)
        if(!await validTeacherSession(request,env,identity,role))
          return error('관리자 로그인이 필요합니다.',401)
        if(path==='/api/admin/roles')
          return secure(await handleRoleAdminApi(request,env,identity,role))
        if(path.startsWith('/api/admin/native/'))
          return secure(await adminContentApi(request,env,identity))
        if(path==='/api/admin/learning'||path.startsWith('/api/admin/learning/')||
           path==='/api/admin/quizzes'||path==='/api/admin/quiz')
          return secure(await handleTeacherLearningApi(request,env,identity))
        return error('관리자 API를 찾을 수 없습니다.',404)
      }
      if(path==='/api/session'&&request.method==='GET'){
        const student=await findStudent(env.DB,identity)
        const profile=student?await ensureStudentId(env.DB,identity):null
        return reply({
          authenticated:true,registered:!!student,email:identity.email,
          studentName:student?.student_name??null,studentId:profile?.student_id??null,
          teacher:canEdit(role),role,rank:roleRank(role),
          storage:'d1'
        })
      }
      if(path==='/api/profile'&&request.method==='POST'){
        if(request.headers.get('Origin')!==url.origin||
           request.headers.get('X-Frontend-Lab')!=='profile'||
           !request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))
          return error('잘못된 요청입니다.',403)
        const body=await request.text()
        if(body.length>500)return error('입력이 너무 깁니다.',413)
        let input:unknown
        try{input=JSON.parse(body)}catch{return error('올바른 입력 형식이 아닙니다.',400)}
        const raw=input&&typeof input==='object'&&'studentName' in input?
          (input as {studentName:unknown}).studentName:undefined
        const name=typeof raw==='string'?raw.trim().replace(/\s+/g,' '):''
        if([...name].length<2||[...name].length>40||/[<>\u0000-\u001f]/.test(name))
          return error('이름을 2~40자로 입력해 주세요.',400)
        const student=await upsertStudent(env.DB,identity,name)
        const profile=await ensureStudentId(env.DB,identity)
        return reply({registered:true,studentName:student.student_name,studentId:profile.student_id})
      }
      if(path.startsWith('/admin')){
        if(!canEdit(role))return error('관리자 접근 권한이 없습니다.',403)
        if(request.method!=='GET'&&request.method!=='HEAD')return error('허용되지 않는 요청입니다.',405)
        return secure(await env.ASSETS.fetch(fromAsset(request,'/index.html')),'text/html; charset=utf-8')
      }
      // Login/name registration must work before any learning data is accessible.
      if(path==='/'||path==='/index.html'||scriptBundle.test(path)){
        if(request.method!=='GET'&&request.method!=='HEAD')return error('허용되지 않는 요청입니다.',405)
        return secure(await env.ASSETS.fetch(fromAsset(request,path==='/index.html'?'/index.html':path)))
      }
      if(path.startsWith('/api/')){
        const allowed=path==='/api/me'||path.startsWith('/api/quiz/')||path.startsWith('/api/content/')
        if(!allowed)return error('API를 찾을 수 없습니다.',404)
      }
      const enrolled=await findStudent(env.DB,identity)
      if(!enrolled)return error('먼저 학습자 이름을 등록해 주세요.',403)
      if(path==='/api/me'||path.startsWith('/api/quiz/'))
        return secure(await handleStudentLearningApi(request,env,identity))
      if(path.startsWith('/api/content/'))
        return secure(await studentContentApi(request,env))
      if(/^\/(?:me|learn\/[a-z0-9-]{3,100}|practice\/[a-z0-9-]{3,60})\/?$/.test(path)){
        if(request.method!=='GET'&&request.method!=='HEAD')return error('허용되지 않는 요청입니다.',405)
        return secure(await env.ASSETS.fetch(fromAsset(request,'/index.html')),'text/html; charset=utf-8')
      }
      if(/^\/(?:ai|flex|grid|javascript|position|quiz|tailwind|uiux)\/[a-zA-Z0-9_./-]+\.html?$/.test(path)){
        if(request.method!=='GET')return error('허용되지 않는 요청입니다.',405)
        return secure(await lookupLegacy(url,env))
      }
      if(contentAsset.test(path)){
        if(request.method!=='GET'&&request.method!=='HEAD')return error('허용되지 않는 요청입니다.',405)
        const asset=await env.ASSETS.fetch(fromAsset(request,path))
        return asset.ok?secure(asset):error('자료를 찾을 수 없습니다.',404)
      }
      // No legacy .html, .data.js, raw answer files or source CSS routes.
      return error('요청한 경로를 찾을 수 없습니다.',404)
    }catch(err){
      console.error('Frontend Lab request failed:',err instanceof Error?err.name:'unknown')
      return error('요청을 처리하지 못했습니다.',503)
    }
  }
}
