import type {D1} from './free-db'
import type {VerifiedIdentity} from './auth'

export type CmsRole = 'creator'|'teacher'|'admin'|'student'
export interface RoleEnv {DB:D1;OWNER_EMAIL?:string;TEACHER_EMAIL?:string}
export const roleRank=(role:CmsRole)=>role==='creator'?0:role==='teacher'?1:role==='admin'?2:3
export const canEdit=(role:CmsRole)=>role!=='student'

function exactEmail(email:string|undefined):string {
  return (email??'').trim().toLowerCase()
}
export async function resolveCmsRole(identity:VerifiedIdentity,env:RoleEnv):Promise<CmsRole>{
  const email=exactEmail(identity.email)
  const owner=exactEmail(env.OWNER_EMAIL)
  const teacher=exactEmail(env.TEACHER_EMAIL)
  if(owner && email===owner)return 'creator'
  if(teacher && email===teacher)return 'teacher'
  const grant=await env.DB.prepare(
    "SELECT role FROM lab_admin_grants WHERE access_subject=? AND lower(email)=? AND revoked_at IS NULL LIMIT 1"
  ).bind(identity.subject,email).first<{role:string}>()
  return grant?.role==='admin'?'admin':'student'
}
interface DirectoryRow{
  access_subject:string;student_name:string;email:string;student_id:string|null;created_at:string
  role:string|null;granted_at:string|null;revoked_at:string|null
}
export async function getRoleDirectory(env:RoleEnv){
  const rows=await env.DB.prepare(
    'SELECT s.access_subject,s.student_name,s.email,p.student_id,s.created_at,'+
    'g.role,g.granted_at,g.revoked_at FROM lab_students s '+
    'LEFT JOIN lab_student_profiles p ON p.access_subject=s.access_subject '+
    'LEFT JOIN lab_admin_grants g ON g.access_subject=s.access_subject '+
    'ORDER BY s.created_at DESC LIMIT 500'
  ).all<DirectoryRow>()
  const logs=await env.DB.prepare(
    'SELECT id,actor_email,target_email,action,recorded_at FROM lab_admin_audit ORDER BY id DESC LIMIT 35'
  ).all<{id:number;actor_email:string;target_email:string;action:string;recorded_at:string}>()
  return {creator:exactEmail(env.OWNER_EMAIL),teacher:exactEmail(env.TEACHER_EMAIL),
    students:(rows.results??[]).map(r=>({...r,role:
      exactEmail(r.email)===exactEmail(env.OWNER_EMAIL)?'creator':
      exactEmail(r.email)===exactEmail(env.TEACHER_EMAIL)?'teacher':
      r.role==='admin'&&!r.revoked_at?'admin':'student'})),
    audit:logs.results??[]}
}

export async function handleRoleAdminApi(request:Request,env:RoleEnv,identity:VerifiedIdentity,role:CmsRole):Promise<Response>{
  const reply=(value:unknown,status=200)=>new Response(JSON.stringify(value),{
    status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store'}
  })
  // Explicitly re-check the signed JWT's creator email; neither teacher nor delegated
  // admins may grant, revoke or even enumerate role grants through this endpoint.
  if(role!=='creator'||exactEmail(identity.email)!==exactEmail(env.OWNER_EMAIL))
    return reply({error:'창조자 전용 권한입니다.'},403)
  const url=new URL(request.url)
  if(request.method==='GET')return reply(await getRoleDirectory(env))
  if(request.method!=='POST')return reply({error:'허용되지 않는 요청입니다.'},405)
  if(request.headers.get('Origin')!==url.origin ||
     request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')!==true ||
     request.headers.get('X-Frontend-Lab')!=='role-write')
    return reply({error:'요청 인증 형식이 올바르지 않습니다.'},403)
  const raw=await request.text()
  if(raw.length>900)return reply({error:'입력 제한을 초과했습니다.'},413)
  let data:Record<string,unknown>
  try{const item=JSON.parse(raw);if(!item||typeof item!=='object'||Array.isArray(item))throw Error();data=item}
  catch{return reply({error:'잘못된 JSON 요청입니다.'},400)}
  const action=data.action
  const target=data.accessSubject
  if((action!=='grant'&&action!=='revoke')||typeof target!=='string'||target.length<8||target.length>255)
    return reply({error:'권한 작업과 계정을 선택해 주세요.'},400)
  const user=await env.DB.prepare(
    'SELECT access_subject,email,student_name FROM lab_students WHERE access_subject=? LIMIT 1'
  ).bind(target).first<{access_subject:string;email:string;student_name:string}>()
  if(!user)return reply({error:'가입된 계정만 관리자로 임명할 수 있습니다.'},404)
  const recipient=exactEmail(user.email)
  if(!recipient||recipient===exactEmail(env.OWNER_EMAIL)||recipient===exactEmail(env.TEACHER_EMAIL))
    return reply({error:'창조자와 선생님 기본 권한은 변경할 수 없습니다.'},403)
  if(action==='grant'){
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO lab_admin_grants(access_subject,email,role,granted_by_email,granted_at,revoked_at) "+
        "VALUES(?,?,'admin',?,datetime('now'),NULL) ON CONFLICT(access_subject) DO UPDATE SET "+
        "email=excluded.email,role='admin',granted_by_email=excluded.granted_by_email,"+
        "granted_at=datetime('now'),revoked_at=NULL"
      ).bind(target,recipient,identity.email),
      env.DB.prepare(
        "INSERT INTO lab_admin_audit(actor_email,target_subject,target_email,action) VALUES(?,?,?,'grant')"
      ).bind(identity.email,target,recipient),
    ])
  }else{
    const old=await env.DB.prepare(
      "SELECT access_subject FROM lab_admin_grants WHERE access_subject=? AND revoked_at IS NULL"
    ).bind(target).first()
    if(!old)return reply({error:'해당 계정에는 활성 관리자 권한이 없습니다.'},409)
    await env.DB.batch([
      env.DB.prepare("UPDATE lab_admin_grants SET revoked_at=datetime('now') WHERE access_subject=?").bind(target),
      env.DB.prepare(
        "INSERT INTO lab_admin_audit(actor_email,target_subject,target_email,action) VALUES(?,?,?,'revoke')"
      ).bind(identity.email,target,recipient),
      env.DB.prepare('DELETE FROM lab_teacher_sessions WHERE email=?').bind(recipient),
    ])
  }
  return reply({ok:true,action,targetEmail:recipient})
}
