import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import ts from 'typescript'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const getFile=p=>fs.readFileSync(path.join(root,p),'utf8')
let moduleCache
async function core(){
  if(moduleCache)return moduleCache
  const code=ts.transpileModule(getFile('worker/roles.ts'),{
    compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}
  }).outputText
  moduleCache=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
  return moduleCache
}
const config={OWNER_EMAIL:'sea35652@gmail.com',TEACHER_EMAIL:'spacejh72@gmail.com'}
const noDB={prepare(){throw Error('No D1 read expected for fixed roles')}}
test('creator and teacher ranks are immutable exact verified Google-email matches',async()=>{
  const {resolveCmsRole,roleRank}=await core()
  assert.equal(await resolveCmsRole({subject:'x',email:'sea35652@gmail.com'},{...config,DB:noDB}),'creator')
  assert.equal(await resolveCmsRole({subject:'y',email:'spacejh72@gmail.com'},{...config,DB:noDB}),'teacher')
  assert.deepEqual(['creator','teacher','admin','student'].map(roleRank),[0,1,2,3])
})
test('delegated admin is bound to signed Access subject and email together',async()=>{
  const {resolveCmsRole}=await core()
  const db={prepare(sql){
    assert.match(sql,/access_subject=\? AND lower\(email\)=\? AND revoked_at IS NULL/)
    return {bind(subject,email){
      return {async first(){
        return subject==='verified-subject'&&email==='student@example.com'?{role:'admin'}:null
      }}
    }}
  }}
  const env={...config,DB:db}
  assert.equal(await resolveCmsRole({subject:'verified-subject',email:'student@example.com'},env),'admin')
  assert.equal(await resolveCmsRole({subject:'unverified-subject',email:'student@example.com'},env),'student')
  assert.equal(await resolveCmsRole({subject:'verified-subject',email:'other@example.com'},env),'student')
})
test('non-creator including teacher cannot use creator-only role grant endpoint',async()=>{
  const {handleRoleAdminApi}=await core()
  const request=new Request('https://frontend-lab.rhee.life/api/admin/roles',{method:'GET'})
  const teacher=await handleRoleAdminApi(request,{...config,DB:noDB},
    {subject:'x',email:'spacejh72@gmail.com'},'teacher')
  assert.equal(teacher.status,403)
  const admin=await handleRoleAdminApi(request,{...config,DB:noDB},
    {subject:'x',email:'student@example.com'},'admin')
  assert.equal(admin.status,403)
  const spoof=await handleRoleAdminApi(request,{...config,DB:noDB},
    {subject:'x',email:'attacker@example.com'},'creator')
  assert.equal(spoof.status,403)
})
test('role writes require exact same origin, JSON and anti-CSRF custom header',async()=>{
  const {handleRoleAdminApi}=await core()
  const request=new Request('https://frontend-lab.rhee.life/api/admin/roles',{method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'grant',accessSubject:'forged-subject'})})
  const r=await handleRoleAdminApi(request,{...config,DB:noDB},
    {subject:'creator-sub',email:'sea35652@gmail.com'},'creator')
  assert.equal(r.status,403)
})
test('role schema records delegated assignments and auditable revocations',()=>{
  const sql=getFile('migrations/0005_creator_roles.sql')
  assert.match(sql,/lab_admin_grants/)
  assert.match(sql,/lab_admin_audit/)
  assert.match(sql,/REFERENCES lab_students\(access_subject\)/)
  assert.match(sql,/revoked_at TEXT/)
  assert.doesNotMatch(sql,/DROP TABLE|DELETE FROM lab_students/)
})
test('the supplied SVG brand is present unchanged and safe for img rendering',()=>{
  const svg=getFile('public/ui/blue-renaissance-logo.svg')
  assert.match(svg,/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/)
  assert.match(svg,/viewBox="0 0 527\.16 127\.77"/)
  assert.doesNotMatch(svg,/<(?:script|foreignObject)\b|onload=/i)
  assert.match(getFile('src/BlueRenaissanceBrand.tsx'),/blue-renaissance-logo\.svg/)
})
