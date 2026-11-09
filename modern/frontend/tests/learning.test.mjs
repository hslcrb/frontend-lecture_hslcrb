import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import ts from 'typescript'
import {legacyQuizCatalog, syncOriginal} from '../scripts/sync-original.mjs'

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
test('legacy quiz catalog generates protected answers and importable questions',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'fl-quiz-'))
  const source=path.join(tmp,'repo')
  const output=path.join(tmp,'output')
  try{
    fs.mkdirSync(path.join(source,'quiz'),{recursive:true})
    fs.mkdirSync(path.join(source,'assets/css'),{recursive:true})
    fs.mkdirSync(path.join(source,'assets/js'),{recursive:true})
    fs.writeFileSync(path.join(source,'DESIGN.md'),'# design')
    fs.writeFileSync(path.join(source,'index.html'),'<body><p>home</p></body>')
    fs.writeFileSync(path.join(source,'assets/css/tokens.css'),'body {color:#172033;}')
    fs.writeFileSync(path.join(source,'assets/js/quiz-unified.js'),
      "let current=0,answers=new Array(arr.length).fill(null),showResult=false;\n"+
      "function renderScore(){ const review=document.getElementById('quiz-revisit'); }\n"+
      "const restart=()=>{current=0;answers=new Array(arr.length).fill(null);showResult=false;render()}")
    fs.writeFileSync(path.join(source,'quiz/sample.html'),
      '<title>Practice Test</title><script src="sample.data.js"></script><script src="../assets/js/quiz-unified.js"></script>')
    fs.writeFileSync(path.join(source,'quiz/sample.data.js'),
      "window.QUIZ_CONFIG={title:'Practice Test'};window.QUIZ_DATA=[{q:'A?',opts:['x','y'],ans:1,ex:'Y'}];")
    const catalog=legacyQuizCatalog(source)
    assert.equal(catalog.items.length,1)
    assert.equal(catalog.items[0].keys[0].answer,1)
    assert.equal(catalog.items[0].editable?.[0].prompt,'A?')
    syncOriginal(source,output)
    const copied=fs.readFileSync(path.join(output,'assets/js/quiz-unified.js'),'utf8')
    assert.match(copied,/quiz\/legacy\/submit/)
    const untouched=fs.readFileSync(path.join(source,'assets/js/quiz-unified.js'),'utf8')
    assert.doesNotMatch(untouched,/quiz\/legacy\/submit/)
    const secret=JSON.parse(fs.readFileSync(path.join(output,'original-quiz-keys.json'),'utf8'))
    assert.equal(secret.items.length,1)
  }finally{fs.rmSync(tmp,{recursive:true,force:true})}
})
test('protected original answer catalog and teacher-only analytics routes are server enforced',()=>{
  const worker=fs.readFileSync(path.join(root,'worker/index.ts'),'utf8')
  assert.match(worker,/path==='\/original-quiz-keys\.json'/)
  assert.match(worker,/validTeacherSession\(request,env,identity\)/)
  assert.match(worker,/handleTeacherLearningApi\(request,env,identity\)/)
  assert.match(worker,/handleStudentLearningApi\(request,env,identity\)/)
  assert.match(worker,/if\(!enrolled\)return error/)
})
