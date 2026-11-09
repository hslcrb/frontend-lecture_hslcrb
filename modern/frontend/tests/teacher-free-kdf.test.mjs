import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const read=file=>fs.readFileSync(path.join(root,file),'utf8')
const dataUrl=js=>'data:text/javascript;base64,'+Buffer.from(js).toString('base64')

let modulePromise
function loadAuth(){
  if(modulePromise)return modulePromise
  const transpile=code=>ts.transpileModule(code,{
    compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}
  }).outputText
  const roles=dataUrl(transpile(read('worker/roles.ts')))
  const auth=transpile(read('worker/teacher-auth.ts')).replaceAll("from './roles'","from '"+roles+"'")
  modulePromise=import(dataUrl(auth))
  return modulePromise
}
class FakeD1 {
  credentials=new Map()
  sessions=new Map()
  prepare(sql){
    return {bind:(...args)=>({
      first:async()=>{
        if(sql.includes('FROM lab_teacher_credentials WHERE email=?'))
          return this.credentials.get(args[0])??null
        if(sql.includes('FROM lab_teacher_sessions')){
          const row=this.sessions.get(args[0])
          return row&&row.email===args[1]&&row.access_subject===args[2]&&row.expires_at>args[3]?row:null
        }
        return null
      },
      run:async()=>{
        if(sql.includes('INSERT INTO lab_teacher_credentials')){
          this.credentials.set(args[0],{salt:args[1],password_hash:args[2],hash_iterations:args[3],
            hash_scheme:args[4],failed_attempts:0,locked_until:0})
        }else if(sql.includes('INSERT INTO lab_teacher_sessions')){
          this.sessions.set(args[0],{session_hash:args[0],email:args[1],
            access_subject:args[2],created_at:args[3],expires_at:args[4]})
        }else if(sql.includes('UPDATE lab_teacher_credentials SET failed_attempts')){
          const row=this.credentials.get(args[2]);row.failed_attempts=args[0];row.locked_until=args[1]
        }else if(sql.includes('UPDATE lab_teacher_credentials SET failed_attempts=0')){
          const row=this.credentials.get(args[0]);row.failed_attempts=0;row.locked_until=0
        }
        return {success:true}
      }
    })}
  }
}
function call(path,body,extraHeaders={}){
  return new Request('https://frontend-lab.rhee.life'+path,{
    method:body?'POST':'GET',
    headers:body?{'Origin':'https://frontend-lab.rhee.life','X-Frontend-Lab':'teacher-auth',
      'Content-Type':'application/json',...extraHeaders}:extraHeaders,
    body:body?JSON.stringify(body):undefined,
  })
}
function base64Url(bytes) {
  return Buffer.from(bytes).toString('base64url')
}
async function clientProof(password,kdf){
  assert.equal(kdf.iterations,120000)
  const encoder=new TextEncoder()
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits'])
  const bits=await crypto.subtle.deriveBits({
    name:'PBKDF2',hash:'SHA-256',iterations:kdf.iterations,
    salt:Buffer.from(kdf.salt,'base64url')
  },key,256)
  return base64Url(Buffer.from(bits))
}
test('signed creator receives a valid KDF setup ticket without server-side password work',async()=>{
  const {handleTeacherAction}=await loadAuth()
  const env={DB:new FakeD1(),AUTH_PEPPER:'a'.repeat(64)}
  const identity={email:'sea35652@gmail.com',subject:'verified-creator'}
  const response=await handleTeacherAction(call('/api/teacher/status'),env,identity,'creator')
  assert.equal(response.status,200)
  assert.equal(response.body.configured,false)
  assert.equal(response.body.kdf.scheme,'client_pbkdf2_hmac_v1')
  assert.match(response.body.kdf.salt,/^[A-Za-z0-9_-]{22}$/)
  assert.match(response.body.kdf.ticket,/^\d{10}\.[A-Za-z0-9_-]{43}$/)
})
test('setup stores a peppered verifier, then a correct proof signs in while a wrong proof is rejected',async()=>{
  const {handleTeacherAction}=await loadAuth()
  const db=new FakeD1()
  const env={DB:db,AUTH_PEPPER:'b'.repeat(64)}
  const identity={email:'sea35652@gmail.com',subject:'creator-subject'}
  const status=await handleTeacherAction(call('/api/teacher/status'),env,identity,'creator')
  const kdf=status.body.kdf
  const proof=await clientProof('a unique strong password, 18 chars',kdf)
  const setup=await handleTeacherAction(call('/api/teacher/setup',{
    salt:kdf.salt,ticket:kdf.ticket,proof
  }),env,identity,'creator')
  assert.equal(setup.status,200)
  assert.match(setup.cookie,/HttpOnly; Secure; SameSite=Strict/)
  assert.equal(db.credentials.size,1)
  const record=db.credentials.get(identity.email)
  assert.equal(record.hash_scheme,'client_pbkdf2_hmac_v1')
  assert.equal(record.hash_iterations,120000)
  assert.notEqual(record.password_hash,proof)
  assert.notEqual(record.password_hash,'a unique strong password, 18 chars')
  const nextStatus=await handleTeacherAction(call('/api/teacher/status'),env,identity,'creator')
  assert.equal(nextStatus.body.configured,true)
  assert.equal(nextStatus.body.kdf.salt,kdf.salt)
  const bad=await handleTeacherAction(call('/api/teacher/login',{
    proof:await clientProof('incorrect password 12345',nextStatus.body.kdf)
  }),env,identity,'creator')
  assert.equal(bad.status,401)
  const login=await handleTeacherAction(call('/api/teacher/login',{proof}),env,identity,'creator')
  assert.equal(login.status,200)
  assert.match(login.cookie,/__Host-FLTeacher=/)
})
test('ticket cannot be reused by another identity or purpose',async()=>{
  const {handleTeacherAction}=await loadAuth()
  const env={DB:new FakeD1(),AUTH_PEPPER:'c'.repeat(64)}
  const creator={email:'sea35652@gmail.com',subject:'creator-a'}
  const other={email:'sea35652@gmail.com',subject:'creator-b'}
  const status=await handleTeacherAction(call('/api/teacher/status'),env,creator,'creator')
  const kdf=status.body.kdf
  const proof=await clientProof('another strong random password',kdf)
  const cross=await handleTeacherAction(call('/api/teacher/setup',{
    proof,salt:kdf.salt,ticket:kdf.ticket
  }),env,other,'creator')
  assert.equal(cross.status,410)
  assert.equal(env.DB.credentials.size,0)
})
test('Workers Free config keeps dashboard secrets across builds',()=>{
  const config=JSON.parse(read('wrangler.jsonc'))
  assert.equal(config.keep_vars,true)
  assert.deepEqual(config.secrets.required,['AUTH_PEPPER'])
  const migration=read('migrations/0006_client_kdf_admin.sql')
  assert.match(migration,/hash_scheme/)
  assert.doesNotMatch(read('worker/teacher-auth.ts'),/console\.log\(.*(?:proof|password)/)
})
