import type { D1 } from './free-db'
import type { VerifiedIdentity } from './auth'
import { teacherMatches } from './teacher-auth'
import { getCourseSource, listCourseSources, isCoursePath, syncCourseFromBuild } from './course-db'
import {
  pathKind,findEntry,contentHistory,contentList,saveDraft,
  publishDraft,setHidden,restoreVersion,
} from './free-db'

interface AdminEnv {
  DB: D1
  ASSETS: {fetch:(request:Request)=>Promise<Response>}
  TEACHER_EMAIL?: string
}

function reply(data: unknown,status=200):Response {
  return new Response(JSON.stringify(data),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store',
    'X-Content-Type-Options':'nosniff',
  }})
}

export function isTeacher(identity: VerifiedIdentity, env: AdminEnv): boolean {
  return teacherMatches(identity,env)
}

async function originalSource(request: Request, env: AdminEnv, path: string):Promise<string> {
  const archived=await getCourseSource(env.DB,path)
  if(archived)return archived.source_html
  const location=path==='/'?'/original-home.html':path
  const url=new URL(request.url)
  url.pathname=location
  url.search=''
  const response=await env.ASSETS.fetch(new Request(url.toString()))
  return response.ok?await response.text():''
}

async function viewEntry(request: Request, env: AdminEnv, path:string) {
  const entry=await findEntry(env.DB,path)
  const original=await originalSource(request,env,path)
  return reply({
    path,kind:pathKind(path),source:entry?.draft_source??original,
    published:entry?.published_source!==null && entry?.published_source!==undefined,
    hidden:Boolean(entry?.hidden),
    hasDraft:entry!==null && entry.draft_source!==entry.published_source,
    originalExists:original.length>0,
    originalStorage:(await getCourseSource(env.DB,path))?'d1':'static',
    updatedAt:entry?.updated_at??null,
    publishedAt:entry?.published_at??null,
    originalLength:original.length,
  })
}

/** Caller MUST validate signed Access identity and exact teacher allowlist first. */
export async function handleAdminApi(
  request:Request, env:AdminEnv, identity: VerifiedIdentity,
):Promise<Response> {
  if(!isTeacher(identity,env))return reply({error:'선생님 관리자 계정만 접근할 수 있습니다.'},403)
  const url=new URL(request.url)
  const route=url.pathname
  try {
    if(request.method==='GET') {
      if(route==='/api/admin/me') return reply({email:identity.email})
      if(route==='/api/admin/students') {
        const records=await env.DB.prepare(
          'SELECT student_name,email,created_at,updated_at FROM lab_students ORDER BY created_at DESC LIMIT 200'
        ).all()
        return reply({students:records.results??[],storage:'d1'})
      }
      if(route==='/api/admin/courses')
        return reply({courses:await listCourseSources(env.DB)})
      if(route==='/api/admin/manifest') {
        const asset=new URL('/original-manifest.json',url)
        const response=await env.ASSETS.fetch(new Request(asset.toString()))
        const original=response.ok?await response.json() as {items?:Array<{path:string;kind:string;title:string}>}:{items:[]}
        const courses=await listCourseSources(env.DB)
        const merged=new Map<string,{path:string;kind:string;title:string}>((original.items??[]).map(item=>[item.path,item] as const))
        for(const course of courses)merged.set(course.path,{path:course.path,kind:'html',title:course.title})
        return reply({original:{items:[...merged.values()]},edited:await contentList(env.DB),courses})
      }
      const path=url.searchParams.get('path')??'/'
      if(!pathKind(path))return reply({error:'잘못된 경로입니다.'},400)
      if(route==='/api/admin/content')return viewEntry(request,env,path)
      if(route==='/api/admin/history')return reply({versions:await contentHistory(env.DB,path)})
      return reply({error:'관리자 API 경로가 없습니다.'},404)
    }
    if(request.method!=='POST' || (route!=='/api/admin/content' && route!=='/api/admin/course/sync'))
      return reply({error:'지원하지 않는 관리자 요청입니다.'},405)
    // Access cookies are ambient. Strict same-origin + non-simple header protect mutations.
    if(request.headers.get('Origin')!==url.origin ||
       request.headers.get('X-Frontend-Lab')!=='cms-write' ||
       !request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))
      return reply({error:'요청 출처를 확인할 수 없습니다.'},403)
    const raw=await request.text()
    if(raw.length>900000)return reply({error:'요청 본문이 너무 큽니다.'},413)
    let data:Record<string,unknown>
    try {
      const parsed=JSON.parse(raw)
      if(!parsed || typeof parsed!=='object' || Array.isArray(parsed))throw Error()
      data=parsed
    } catch {return reply({error:'JSON 형식이 올바르지 않습니다.'},400)}
    const path=typeof data.path==='string'?data.path:''
    if(route==='/api/admin/course/sync') {
      if(!isCoursePath(path))return reply({error:'HTML 강의 경로만 동기화할 수 있습니다.'},400)
      const result=await syncCourseFromBuild(env.DB,request,env.ASSETS,path)
      return reply({ok:true,...result})
    }
    if(!pathKind(path))return reply({error:'지원하지 않는 강의 경로입니다.'},400)
    const action=data.action
    if(action==='saveDraft') {
      if(typeof data.source!=='string')return reply({error:'초안 내용을 입력해 주세요.'},400)
      await saveDraft(env.DB,path,data.source,identity.email)
    } else if(action==='publish') {
      await publishDraft(env.DB,path,identity.email)
    } else if(action==='hide' || action==='show') {
      await setHidden(env.DB,path,identity.email,action==='hide')
    } else if(action==='restore') {
      const id=data.versionId
      if(typeof id!=='number'||!Number.isSafeInteger(id)||id<=0)
        return reply({error:'유효한 수정 이력을 선택해 주세요.'},400)
      await restoreVersion(env.DB,path,id,identity.email)
    } else return reply({error:'알 수 없는 작업입니다.'},400)
    const entry=await findEntry(env.DB,path)
    return reply({ok:true,path,action,updatedAt:entry?.updated_at??null})
  } catch(e) {
    console.error('Free CMS error:',e instanceof Error?e.message:'unknown')
    return reply({error:'작업을 완료하지 못했습니다. D1 연결과 데이터베이스 마이그레이션을 확인해 주세요.'},503)
  }
}
