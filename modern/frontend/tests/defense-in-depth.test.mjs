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
test('student table has strict RLS and zero public grants',()=>{
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
