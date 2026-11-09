import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const read=p=>fs.readFileSync(path.join(root,p),'utf8')

test('all course and question content is in D1 schemas, not static file imports',()=>{
  const sql=read('migrations/0007_react_native_lessons.sql')
  assert.match(sql,/CREATE TABLE IF NOT EXISTS br_lessons/)
  assert.match(sql,/CREATE TABLE IF NOT EXISTS br_lesson_versions/)
  assert.match(sql,/CREATE TABLE IF NOT EXISTS br_legacy_quiz_map/)
  const config=JSON.parse(read('package.json'))
  assert.equal(config.scripts.prebuild,undefined)
  assert.equal(config.scripts.predev,undefined)
  assert.equal(config.scripts['sync:original'],undefined)
})

test('Worker routes lessons and quizzes to D1 backed React experiences',()=>{
  const worker=read('worker/index.ts')
  assert.match(worker,/lookupLegacy\(url,env\)/)
  assert.match(worker,/studentContentApi\(request,env\)/)
  assert.match(worker,/handleStudentLearningApi\(request,env,identity\)/)
  assert.match(worker,/if\(path.endsWith\('\.data\.js'\)\)/)
})

test('teacher CMS uses React content and quiz editors, never source file explorer',()=>{
  const ws=read('src/TeacherWorkspace.tsx')
  assert.match(ws,/CourseStudio/)
  assert.match(ws,/QuestionBank/)
  assert.doesNotMatch(ws,/AdminConsole|QuizStudio/)
  const q=read('src/QuestionBank.tsx')
  assert.match(q,/전체 문항/)
  assert.match(q,/문항 편집/)
  assert.match(q,/정답/)
  const c=read('src/CourseStudio.tsx')
  assert.match(c,/contentEditable/)
  assert.match(c,/초안 저장/)
  assert.match(c,/강의 게시/)
})

test('Blue Renaissance branding is retained',()=>{
  const brand=read('src/BlueRenaissanceBrand.tsx')
  assert.match(brand,/blue-renaissance-logo\.svg/)
  assert.match(read('src/TeacherWorkspace.tsx'),/<BlueRenaissanceBrand\/>/)
})
