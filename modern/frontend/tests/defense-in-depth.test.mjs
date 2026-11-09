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
test('Blue Renaissance uses Cloudflare D1 as the sole learning database',()=>{
  const worker=read('worker/index.ts')
  const config=JSON.parse(read('wrangler.jsonc'))
  assert.equal(config.d1_databases[0].binding,'DB')
  assert.doesNotMatch(worker,/lookupStudent|saveStudent|SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY/)
  assert.equal(config.vars.STUDENT_STORAGE,'d1')
})
test('browser imports no server credentials',()=>{
  for(const x of ['src/main.tsx','src/App.tsx','src/portal.css']){
    assert.doesNotMatch(read(x),/SUPABASE_SERVICE_ROLE_KEY|service_role/)
  }
})
test('local SVG assets stay under React public design resources',()=>{
  const icons=fs.readdirSync(path.join(frontend,'public/ui/icons')).filter(x=>x.endsWith('.svg'))
  assert.equal(icons.length,31)
  for(const name of icons)assert.match(read('public/ui/icons/'+name),/^<svg xmlns=/)
  assert.match(read('public/ui/blue-renaissance-logo.svg'),/<svg/)
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
test('React D1 CMS and student data are protected by the Worker',()=>{
  const worker=read('worker/index.ts')
  const cms=read('worker/native-content.ts')
  assert.match(worker,/verifyAccess\(request,env\)/)
  assert.match(worker,/if\(!enrolled\)return error/)
  assert.match(worker,/validTeacherSession\(request,env,identity,role\)/)
  assert.match(worker,/adminContentApi\(request,env,identity\)/)
  assert.match(cms,/req.headers.get\('Origin'\)/)
  assert.match(cms,/course-write/)
})

test('teacher password and reset are Google-bound and stored in D1',()=>{
  const auth=read('worker/teacher-auth.ts')
  const api=read('worker/index.ts')
  assert.match(auth,/getCredential\(env,\s*identity\)/)
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
