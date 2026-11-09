import type { D1 } from './free-db'
import type { VerifiedIdentity } from './auth'
import {roleRank,type CmsRole} from './roles'

export const TEACHER_COOKIE='__Host-FLTeacher'
export const SESSION_SECONDS=12*60*60
const RESET_SECONDS=15*60
const ITERATIONS=120_000
const encoder=new TextEncoder()

export interface TeacherEnv {
  DB:D1
  TEACHER_EMAIL?:string
  OWNER_EMAIL?:string
  EMAIL_FROM?:string
  EMAIL?:{send:(message:{from:string;to:string;subject:string;text:string;html:string})=>Promise<{messageId?:string}>}
}
type Credential={salt:string;password_hash:string;hash_iterations:number;failed_attempts:number;locked_until:number}
const now=()=>Math.floor(Date.now()/1000)

function bytesToBase64Url(bytes:Uint8Array):string {
  let bin=''
  for(const value of bytes)bin+=String.fromCharCode(value)
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'')
}
function base64UrlToBytes(data:string):Uint8Array {
  const bin=atob(data.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-data.length%4)%4))
  return Uint8Array.from(bin,ch=>ch.charCodeAt(0))
}
function randomSecret(length=32):string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(length)))
}
async function sha256(value:string):Promise<string> {
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))))
}
async function pbkdf2(password:string,salt:string,iterations:number):Promise<string> {
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits'])
  const result=await crypto.subtle.deriveBits(
    {name:'PBKDF2',hash:'SHA-256',iterations,salt:base64UrlToBytes(salt) as BufferSource},
    key,256)
  return bytesToBase64Url(new Uint8Array(result))
}
function constantTimeEquals(a:string,b:string):boolean {
  const A=encoder.encode(a),B=encoder.encode(b)
  let difference=A.length^B.length
  for(let i=0;i<Math.max(A.length,B.length);i++)difference|=(A[i]??0)^(B[i]??0)
  return difference===0
}
function validatePassword(password:unknown):password is string {
  return typeof password==='string'&&[...password].length>=12&&[...password].length<=128&&
    !/[\u0000-\u001f\u007f]/.test(password)
}

export function teacherMatches(identity:VerifiedIdentity,env:TeacherEnv):boolean {
  const email=identity.email.toLowerCase()
  const teacher=(env.TEACHER_EMAIL??'').trim().toLowerCase()
  const creator=(env.OWNER_EMAIL??'').trim().toLowerCase()
  return (!!creator&&email===creator)||(!!teacher&&email===teacher)
}
function cookieToken(request:Request):string|null {
  const cookie=request.headers.get('Cookie')??''
  const match=cookie.match(/(?:^|;\s*)__Host-FLTeacher=([^;]+)/)
  return match&&/^[a-zA-Z0-9_-]{40,50}$/.test(match[1])?match[1]:null
}
function sessionCookie(token:string,age:number):string {
  return TEACHER_COOKIE+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age='+age
}
export function clearSessionCookie():string {return sessionCookie('',0)}
export async function getCredential(env:TeacherEnv,identity:VerifiedIdentity):Promise<Credential|null>{
  return await env.DB.prepare('SELECT salt,password_hash,hash_iterations,failed_attempts,locked_until FROM lab_teacher_credentials WHERE email=?')
    .bind(identity.email.toLowerCase()).first<Credential>()
}
export async function validTeacherSession(request:Request,env:TeacherEnv,identity:VerifiedIdentity,role:CmsRole):Promise<boolean>{
  if(role==='student')return false
  const token=cookieToken(request)
  if(!token)return false
  const digest=await sha256(token)
  const item=await env.DB.prepare('SELECT session_hash FROM lab_teacher_sessions WHERE session_hash=? AND email=? AND access_subject=? AND expires_at>?')
    .bind(digest,identity.email.toLowerCase(),identity.subject,now()).first()
  return Boolean(item)
}
async function makeSession(env:TeacherEnv,identity:VerifiedIdentity):Promise<string> {
  const token=randomSecret()
  const digest=await sha256(token)
  await env.DB.prepare('INSERT INTO lab_teacher_sessions(session_hash,email,access_subject,created_at,expires_at) VALUES(?,?,?, ?,?)')
    .bind(digest,identity.email.toLowerCase(),identity.subject,now(),now()+SESSION_SECONDS).run()
  return sessionCookie(token,SESSION_SECONDS)
}
export interface TeacherActionResult {body:Record<string,unknown>;status:number;cookie?:string}
const success=(body:Record<string,unknown>,cookie?:string):TeacherActionResult=>({body,status:200,cookie})
const fail=(message:string,status=400):TeacherActionResult=>({body:{error:message},status})

export async function handleTeacherAction(
  req:Request,env:TeacherEnv,identity:VerifiedIdentity,role:CmsRole,
):Promise<TeacherActionResult>{
  if(role==='student')return fail('관리자로 승인된 계정만 이용할 수 있습니다.',403)
  const url=new URL(req.url)
  if(req.method==='GET'&&url.pathname==='/api/teacher/status') {
    const cred=await getCredential(env,identity)
    const loggedIn=Boolean(cred)&&await validTeacherSession(req,env,identity,role)
    return success({teacher:role==='teacher',role,rank:roleRank(role),email:identity.email,
      configured:!!cred,authenticated:loggedIn,resetEmail:identity.email})
  }
  if(req.method!=='POST')return fail('지원하지 않는 작업입니다.',405)
  if(req.headers.get('Origin')!==url.origin||
     req.headers.get('X-Frontend-Lab')!=='teacher-auth'||
     !req.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))return fail('잘못된 요청 출처입니다.',403)
  const raw=await req.text()
  if(raw.length>1200)return fail('입력 길이를 초과했습니다.',413)
  let payload:{password?:unknown;token?:unknown}
  try {
    payload=JSON.parse(raw)
    if(!payload||typeof payload!=='object'||Array.isArray(payload))return fail('요청 형식이 올바르지 않습니다.')
  }catch{return fail('JSON 형식이 잘못되었습니다.')}
  const action=url.pathname
  const cred=await getCredential(env,identity)

  if(action==='/api/teacher/setup') {
    // Only a signed Google identity that currently holds a CMS role can bootstrap its own password.
    if(cred)return fail('관리자 비밀번호가 이미 설정되어 있습니다.',409)
    if(!validatePassword(payload.password))return fail('비밀번호는 12~128자로 설정해 주세요.')
    const salt=randomSecret(16)
    const derived=await pbkdf2(payload.password,salt,ITERATIONS)
    await env.DB.prepare('INSERT INTO lab_teacher_credentials(email,salt,password_hash,hash_iterations) VALUES(?,?,?,?)')
      .bind(identity.email.toLowerCase(),salt,derived,ITERATIONS).run()
    return success({ok:true,configured:true},await makeSession(env,identity))
  }
  if(action==='/api/teacher/login') {
    if(!cred)return fail('먼저 관리자 비밀번호를 설정해 주세요.',409)
    if(cred.locked_until>now())return fail('로그인 시도가 많아 15분간 잠겼습니다.',429)
    if(typeof payload.password!=='string'||payload.password.length>256)return fail('비밀번호를 입력해 주세요.')
    const computed=await pbkdf2(payload.password,cred.salt,cred.hash_iterations)
    if(!constantTimeEquals(computed,cred.password_hash)) {
      const attempts=cred.failed_attempts+1
      await env.DB.prepare('UPDATE lab_teacher_credentials SET failed_attempts=?,locked_until=? WHERE email=?')
        .bind(attempts>=5?0:attempts,attempts>=5?now()+900:0,identity.email.toLowerCase()).run()
      return fail('비밀번호가 올바르지 않습니다.',401)
    }
    await env.DB.prepare('UPDATE lab_teacher_credentials SET failed_attempts=0,locked_until=0 WHERE email=?')
      .bind(identity.email.toLowerCase()).run()
    return success({ok:true,authenticated:true},await makeSession(env,identity))
  }
  if(action==='/api/teacher/logout') {
    const token=cookieToken(req)
    if(token)await env.DB.prepare('DELETE FROM lab_teacher_sessions WHERE session_hash=? AND email=?')
      .bind(await sha256(token),identity.email.toLowerCase()).run()
    return success({ok:true},clearSessionCookie())
  }
  if(action==='/api/teacher/reset/request') {
    if(!cred)return fail('비밀번호가 아직 설정되지 않았습니다.',409)
    if(!env.EMAIL) return fail('무료 이메일 발송 설정이 준비되지 않았습니다.',503)
    const latest=await env.DB.prepare('SELECT created_at FROM lab_teacher_reset_tokens WHERE email=? ORDER BY created_at DESC LIMIT 1')
      .bind(identity.email.toLowerCase()).first<{created_at:number}>()
    if(latest&&latest.created_at>now()-300)return success({ok:true,message:'최근 인증 요청을 확인해 주세요. 5분 후 다시 시도할 수 있습니다.'})
    const token=randomSecret()
    const hash=await sha256(token)
    await env.DB.prepare('INSERT INTO lab_teacher_reset_tokens(token_hash,email,created_at,expires_at) VALUES(?,?,?,?)')
      .bind(hash,identity.email.toLowerCase(),now(),now()+RESET_SECONDS).run()
    const address=env.EMAIL_FROM?.trim()||'no-reply@rhee.life'
    const link=url.origin+'/admin#reset='+token
    try {
      await env.EMAIL.send({
        from:address,to:identity.email,
        subject:'Blue Renaissance CMS 관리자 비밀번호 재설정',
        text:'요청하신 관리자 비밀번호 재설정 링크입니다.\n\n'+link+'\n\n15분 동안 한 번만 사용할 수 있습니다. 요청하지 않았다면 이 메일을 무시하세요.',
        html:'<p>Frontend Lab 관리자 비밀번호 재설정 요청입니다.</p><p><a href="'+link+'">비밀번호 재설정하기</a></p><p>15분간 유효하며 한 번만 사용할 수 있습니다.</p>',
      })
    } catch(e) {
      await env.DB.prepare('DELETE FROM lab_teacher_reset_tokens WHERE token_hash=?').bind(hash).run()
      console.error('Teacher reset mail delivery failed',e instanceof Error?e.message:'unknown')
      return fail('메일 발송이 아직 불가능합니다. Cloudflare에서 해당 수신 주소 인증과 발송 허용 목록을 확인해 주세요.',503)
    }
    return success({ok:true,message:'인증된 Google 이메일로 비밀번호 재설정 링크를 보냈습니다.'})
  }
  if(action==='/api/teacher/reset/confirm') {
    if(!cred)return fail('관리자 비밀번호가 아직 설정되지 않았습니다.',409)
    if(typeof payload.token!=='string'||!/^[A-Za-z0-9_-]{40,50}$/.test(payload.token))return fail('링크가 올바르지 않습니다.',400)
    if(!validatePassword(payload.password))return fail('비밀번호는 12~128자로 설정해 주세요.')
    const hash=await sha256(payload.token)
    const item=await env.DB.prepare('SELECT token_hash FROM lab_teacher_reset_tokens WHERE token_hash=? AND email=? AND used_at IS NULL AND expires_at>?')
      .bind(hash,identity.email.toLowerCase(),now()).first()
    if(!item)return fail('재설정 링크가 만료되었거나 이미 사용되었습니다.',410)
    const salt=randomSecret(16)
    const derived=await pbkdf2(payload.password,salt,ITERATIONS)
    await env.DB.batch([
      env.DB.prepare("UPDATE lab_teacher_credentials SET salt=?,password_hash=?,hash_iterations=?,updated_at=?,failed_attempts=0,locked_until=0 WHERE email=?")
        .bind(salt,derived,ITERATIONS,now(),identity.email.toLowerCase()),
      env.DB.prepare('UPDATE lab_teacher_reset_tokens SET used_at=? WHERE token_hash=? AND used_at IS NULL')
        .bind(now(),hash),
      env.DB.prepare('DELETE FROM lab_teacher_sessions WHERE email=?').bind(identity.email.toLowerCase()),
    ])
    return success({ok:true,authenticated:true},await makeSession(env,identity))
  }
  return fail('알 수 없는 관리자 인증 요청입니다.',404)
}
