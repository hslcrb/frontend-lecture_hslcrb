import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const frontend=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const modern=path.resolve(frontend,'..')
const read=x=>fs.readFileSync(path.join(frontend,x),'utf8')
test('Worker executes before every static asset',()=>{
  const config=JSON.parse(read('wrangler.jsonc'))
  assert.equal(config.assets.run_worker_first,true)
  assert.equal(config.assets.binding,'ASSETS')
})
test('Access JWT is signature checked with remote JWKS',()=>{
  const s=read('worker/auth.ts')
  assert.match(s,/jwtVerify\(/)
  assert.match(s,/createRemoteJWKSet/)
  assert.match(s,/algorithms: \['RS256'\]/)
  assert.doesNotMatch(s,/Cf-Access-Authenticated-User-Email/)
})
test('optional Supabase student table has strict RLS and zero public grants',()=>{
  const sql=fs.readFileSync(path.join(modern,'supabase/migrations/20261109000000_frontend_lab_students.sql'),'utf8')
  assert.match(sql,/enable row level security/)
  assert.match(sql,/revoke all on table public.frontend_lab_students from public, anon, authenticated/)
  assert.doesNotMatch(sql,/create policy\s+.*\s+to anon/i)
})
test('browser imports no server credentials',()=>{
  for(const x of ['src/main.tsx','src/App.tsx','src/portal.css']){
    assert.doesNotMatch(read(x),/SUPABASE_SERVICE_ROLE_KEY|service_role/)
  }
})
test('hand drawn SVG icon exists for each mapped emoji', async()=>{
  const {iconNames}=await import('../scripts/sync-original.mjs')
  assert.equal(Object.keys(iconNames).length,31)
  for(const name of Object.values(iconNames)){
    const file=path.join(frontend,'public/ui/icons/'+name+'.svg')
    assert.equal(fs.existsSync(file),true,name)
    assert.match(fs.readFileSync(file,'utf8'),/^<svg xmlns=/)
  }
})

test('free tier uses D1 binding without CMS service binding or R2',()=>{
  const config=JSON.parse(read('wrangler.jsonc'))
  assert.equal(config.d1_databases[0].binding,'DB')
  assert.equal(config.d1_databases[0].database_name,'frontend-lab-cms')
  assert.equal(config.services,undefined)
  assert.equal(config.r2_buckets,undefined)
  assert.equal(config.workers_dev,false)
  assert.equal(config.preview_urls,false)
})
test('student name registration and CMS tables exist in free D1 migration',()=>{
  const s=read('migrations/0001_free_lab.sql')
  assert.match(s,/CREATE TABLE IF NOT EXISTS lab_students/)
  assert.match(s,/CREATE TABLE IF NOT EXISTS lab_content/)
  assert.match(s,/CREATE TABLE IF NOT EXISTS lab_content_versions/)
  assert.match(s,/access_subject TEXT PRIMARY KEY/)
})
test('student data and admin editing are server protected',()=>{
  const worker=read('worker/index.ts')
  const admin=read('worker/free-cms.ts')
  assert.match(worker,/verifyAccess\(request,env\)/)
  assert.match(worker,/if\(!enrolled\)return error/)
  assert.match(admin,/role==='student'/)
  assert.match(admin,/request.headers.get\('Origin'\)!==url.origin/)
  assert.match(admin,/cms-write/)
})

test('teacher password and reset are Google-bound and stored in D1',()=>{
  const auth=read('worker/teacher-auth.ts')
  const api=read('worker/index.ts')
  assert.match(auth,/getCredential\(env,identity\)/)
  assert.match(auth,/PBKDF2/)
  assert.match(auth,/getRandomValues/)
  assert.match(auth,/lab_teacher_credentials/)
  assert.match(auth,/lab_teacher_reset_tokens/)
  assert.match(auth,/__Host-FLTeacher/)
  assert.match(api,/validTeacherSession\(request,env,identity,role\)/)
  assert.match(api,/handleTeacherAction\(request,env,identity,role\)/)
})

test('role hierarchy is creator > teacher > delegated administrator',()=>{
  const roles=read('worker/roles.ts')
  const api=read('worker/index.ts')
  const config=JSON.parse(read('wrangler.jsonc'))
  assert.equal(config.vars.OWNER_EMAIL,'sea35652@gmail.com')
  assert.equal(config.vars.TEACHER_EMAIL,'spacejh72@gmail.com')
  assert.match(roles,/role==='creator'\?0/)
  assert.match(roles,/lab_admin_grants/)
  assert.match(roles,/lab_admin_audit/)
  assert.match(roles,/role!=='creator'/)
  assert.match(api,/resolveCmsRole\(identity,env\)/)
  assert.match(api,/handleRoleAdminApi\(request,env,identity,role\)/)
  assert.match(api,/validTeacherSession\(request,env,identity,role\)/)
})
