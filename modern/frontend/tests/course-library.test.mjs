import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const read=p=>fs.readFileSync(path.join(root,p),'utf8')

test('Blue Renaissance course migration uses an additive independent D1 archive',()=>{
  const sql=read('migrations/0004_blue_renaissance_courses.sql')
  assert.match(sql,/CREATE TABLE IF NOT EXISTS lab_course_sources/)
  assert.match(sql,/path TEXT PRIMARY KEY/)
  assert.match(sql,/source_html TEXT NOT NULL/)
  assert.match(sql,/source_sha TEXT NOT NULL/)
  assert.doesNotMatch(sql,/\b(?:DROP|DELETE|TRUNCATE)\s+(?:TABLE|FROM)\b/i)
})
test('lecture worker serves published changes, then archived HTML, then static assets',()=>{
  const code=read('worker/index.ts')
  const override=code.indexOf("if(result.state==='published' && result.source!==null)")
  const archived=code.indexOf("const course=await getCourseSource(env.DB,path)")
  const assets=code.indexOf("const asset=await env.ASSETS.fetch(staticUrl(request,path))")
  assert.ok(override>=0&&override<archived&&archived<assets)
  assert.match(code,/getCourseSource\(env\.DB,'\/'\)/)
  assert.match(code,/X-Lab-Source/)
})
test('teacher CMS prefers archived origin and updates it without replacing published edits',()=>{
  const api=read('worker/free-cms.ts')
  const db=read('worker/course-db.ts')
  assert.match(api,/getCourseSource\(env.DB,path\)/)
  assert.match(api,/listCourseSources\(env.DB\)/)
  assert.match(api,/syncCourseFromBuild\(env.DB,request,env.ASSETS,path\)/)
  assert.match(api,/X-Frontend-Lab/)
  assert.match(db,/INSERT INTO lab_course_sources/)
  assert.doesNotMatch(db,/UPDATE lab_content SET published_source/)
})
test('CMS brand uses Blue Renaissance and reserves the user-supplied SVG filename',()=>{
  const brand=read('src/BlueRenaissanceBrand.tsx')
  const workspace=read('src/TeacherWorkspace.tsx')
  assert.match(brand,/Blue Renaissance/)
  assert.match(brand,/blue-renaissance-logo\.svg/)
  assert.match(brand,/onError/)
  assert.match(workspace,/<BlueRenaissanceBrand\/>/)
})
