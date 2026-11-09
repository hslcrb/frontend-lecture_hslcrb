import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import ts from 'typescript'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const sql=fs.readFileSync(path.join(root,'migrations/0003_learning_profiles_quizzes.sql'),'utf8')
async function core(){
  const code=fs.readFileSync(path.join(root,'worker/learning-db.ts'),'utf8')
  // Transpile the actual production TypeScript (no copied grading algorithm).
  const javascript=ts.transpileModule(code,{compilerOptions:{
    module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022
  }}).outputText
  return import('data:text/javascript;base64,'+Buffer.from(javascript).toString('base64'))
}
test('D1 migration creates stable student IDs, structured quiz bank, revisions, and attempts',()=>{
  for(const name of ['lab_student_profiles','lab_quiz_sets','lab_quiz_versions','lab_quiz_attempts'])
    assert.match(sql,new RegExp('CREATE TABLE IF NOT EXISTS '+name))
  assert.match(sql,/student_id TEXT NOT NULL UNIQUE/)
  assert.match(sql,/access_subject TEXT NOT NULL/)
  assert.match(sql,/score_percent INTEGER NOT NULL/)
})
test('server-grade logic computes score, never accepts client score',async()=>{
  const {gradeAnswers}=await core()
  const questions=[{answer:1},{answer:0},{answer:'Hello World'}]
  const result=gradeAnswers(questions,[1,2,'hello world'])
  assert.equal(result.correct,2)
  assert.equal(result.total,3)
  assert.equal(result.score,67)
  assert.deepEqual(result.results,[true,false,true])
  assert.throws(()=>gradeAnswers(questions,[1,0]),/개수/)
  assert.throws(()=>gradeAnswers(questions,[1,0,{score:100}]),/형식/)
})
test('structured quiz validation checks correct option ranges and short answers',async()=>{
  const {validateQuizDraft}=await core()
  const questions=validateQuizDraft([
    {id:'q1',kind:'single',prompt:'2+2?',options:['3','4'],answer:1,category:'수학',explanation:'4입니다.'},
    {id:'q2',kind:'short',prompt:'Say hello',answer:'hello',category:'',options:[]},
  ])
  assert.equal(questions.length,2)
  assert.equal(questions[0].answer,1)
  assert.throws(()=>validateQuizDraft([{id:'q1',kind:'single',prompt:'Bad',options:['x','y'],answer:5}]),/정답/)
  assert.throws(()=>validateQuizDraft([]),/1~50/)
  assert.throws(()=>validateQuizDraft([{id:'q1',kind:'short',prompt:'Bad',answer:''}]),/정답/)
})
test('student quiz response redacts correct answers and explanations',async()=>{
  const {redactQuestion}=await core()
  const result=redactQuestion({id:'q1',kind:'single',prompt:'Test',category:'',options:['A','B'],answer:1,explanation:'Secret'})
  assert.equal(result.answer,undefined)
  assert.equal(result.explanation,undefined)
  assert.deepEqual(result.options,['A','B'])
})
test('D1-native React quiz and analytics routes are separated by Google Access roles',()=>{
  const worker=fs.readFileSync(path.join(root,'worker/index.ts'),'utf8')
  assert.match(worker,/validTeacherSession\(request,env,identity,role\)/)
  assert.match(worker,/handleTeacherLearningApi\(request,env,identity\)/)
  assert.match(worker,/handleStudentLearningApi\(request,env,identity\)/)
  assert.match(worker,/studentContentApi\(request,env\)/)
  assert.match(worker,/adminContentApi\(request,env,identity\)/)
  assert.match(worker,/br_legacy_quiz_map/)
})
