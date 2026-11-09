import type { D1 } from './free-db'
import { pathKind } from './free-db'

export interface CourseSource {
  path:string
  title:string
  source_html:string
  source_sha:string
  imported_at:string
  updated_at:string
}
export function isCoursePath(path:string):boolean {
  return pathKind(path)==='html' && path.length<=255
}
export async function getCourseSource(db:D1,path:string):Promise<CourseSource|null> {
  if(!isCoursePath(path))return null
  return await db.prepare(
    'SELECT path,title,source_html,source_sha,imported_at,updated_at '+
    'FROM lab_course_sources WHERE path=? LIMIT 1'
  ).bind(path).first<CourseSource>()
}
export async function listCourseSources(db:D1) {
  const rows=await db.prepare(
    'SELECT path,title,source_sha,imported_at,updated_at,length(source_html) AS bytes '+
    'FROM lab_course_sources ORDER BY path LIMIT 300'
  ).all<{path:string;title:string;source_sha:string;imported_at:string;updated_at:string;bytes:number}>()
  return rows.results??[]
}
async function sha256(content:string) {
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(content))
  return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('')
}
function parseTitle(html:string,path:string) {
  const match=/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  return match?.[1]?.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').trim().slice(0,120)||path
}
export async function readCourseFromBuild(req:Request,assets:{fetch:(req:Request)=>Promise<Response>},path:string){
  if(!isCoursePath(path))throw new Error('HTML 수업 경로가 아닙니다.')
  const url=new URL(req.url)
  url.pathname=path==='/'?'/original-home.html':path
  url.search=''
  const result=await assets.fetch(new Request(url.toString(),{method:'GET'}))
  if(!result.ok||!(result.headers.get('Content-Type')||'').includes('text/html'))
    throw new Error('해당 경로에 원본 강의가 존재하지 않습니다.')
  const html=await result.text()
  if(!html||html.length>450000)throw new Error('원본 HTML 크기가 허용 범위를 벗어났습니다.')
  return {path,html,title:path==='/'?'Frontend Lab · 메인':parseTitle(html,path)}
}
export async function syncCourseFromBuild(db:D1,request:Request,
  assets:{fetch:(req:Request)=>Promise<Response>},path:string) {
  const original=await readCourseFromBuild(request,assets,path)
  const hash=await sha256(original.html)
  const current=await getCourseSource(db,path)
  if(current?.source_sha===hash)return {path,changed:false,title:current.title,bytes:current.source_html.length}
  await db.prepare(
    "INSERT INTO lab_course_sources(path,title,source_html,source_sha) VALUES(?,?,?,?) "+
    "ON CONFLICT(path) DO UPDATE SET title=excluded.title,source_html=excluded.source_html,"+
    "source_sha=excluded.source_sha,updated_at=datetime('now')"
  ).bind(path,original.title,original.html,hash).run()
  return {path,changed:true,title:original.title,bytes:original.html.length}
}
