import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const read=p=>fs.readFileSync(path.join(root,p),'utf8')
const exists=p=>fs.existsSync(path.join(root,p))
test('original Frontend Lab reset/tokens/layout/card/home CSS are preserved in React source',()=>{
  for(const p of ['reset.css','tokens.css','base.css','layout.css','components.css',
    'quiz-unified.css','ai-learning.css','gestalt-common.css','pages/index.css',
    'pages/grid--grid-lecture.css','pages/flex--flex-lecture.css',
    'pages/position--position-lecture.css']){
    assert.equal(exists('src/original-css/'+p),true,p)
  }
  const home=read('src/original-css/pages/index.css')
  assert.match(home,/\.header-nav/)
  assert.match(home,/\.hero-inner/)
  assert.match(home,/\.card-grid/)
  assert.match(home,/\.card-title/)
  assert.match(read('src/original-css/quiz-unified.css'),/\.quiz-choice\.is-correct/)
  assert.match(read('src/original-css/ai-learning.css'),/\.ai-topic/)
})
test('the React homepage renders the original database DOM rather than the new card design',()=>{
  const worker=read('worker/native-content.ts')
  const app=read('src/App.tsx')
  const home=read('src/OriginalHome.tsx')
  assert.match(worker,/'\/api\/content\/home'/)
  assert.match(worker,/FROM br_lessons WHERE slug='home'/)
  assert.match(app,/<OriginalHome/)
  assert.match(home,/parse\(content\)/)
  assert.match(home,/\.nav-links/)
  assert.match(home,/original-css\/pages\/index\.css/)
  assert.doesNotMatch(app,/배움의 모든 과정, 한 공간에서/)
})
test('AI lessons use original React hierarchy of header, steps, topics and examples',()=>{
  const ai=read('src/AiLesson.tsx')
  for(const classname of ['ai-shell','ai-header','ai-tabs','ai-summary','ai-topic',
    'ai-example','ai-case','ai-point','ai-bottom','ai-step-card'])
    assert.match(ai,new RegExp(classname))
  assert.match(read('worker/native-content.ts'),/'\/api\/content\/ai-steps'/)
})
test('quiz uses original step-by-step panel and server-side per-question checks',()=>{
  const quiz=read('src/PracticeQuiz.tsx')
  for(const classname of ['quiz-app','quiz-shell','quiz-header','quiz-panel',
    'quiz-progress-row','quiz-question','quiz-hint','quiz-choice','quiz-feedback',
    'quiz-navigation','quiz-score','quiz-revisit'])
    assert.match(quiz,new RegExp(classname))
  assert.match(quiz,/\/check'/)
  assert.match(read('worker/learning-api.ts'),/managed\[2\]==='check'/)
  assert.match(read('worker/learning-api.ts'),/correctAnswer\(q\.answer,answer\)/)
})
test('Grid, Flex, Position and Tailwind controls are React-driven instead of legacy scripts',()=>{
  const demo=read('src/OriginalDemos.tsx')
  for(const kind of ['grid','flex','position','tailwind'])
    assert.match(demo,new RegExp("key==='"+kind+"'"))
  assert.match(demo,/useState<Values>/)
  assert.match(demo,/onInputCapture=\{onInput\}/)
  assert.match(demo,/onClickCapture=\{onClick\}/)
  assert.match(read('src/LessonPage.tsx'),/<OriginalDemos/)
  assert.match(read('src/LessonPage.tsx'),/safeLessonHtml/)
})
test('course source JavaScript and static lesson HTML cannot be served from active React public directory',()=>{
  const pub=path.join(root,'public')
  const work=[pub]
  while(work.length){
    const dir=work.pop()
    for(const file of fs.readdirSync(dir,{withFileTypes:true})){
      const full=path.join(dir,file.name)
      if(file.isDirectory())work.push(full)
      else assert.doesNotMatch(full,/\.data\.js$|\/(?:grid|flex|ai|quiz|position|javascript)\/[^/]+\.html?$/)
    }
  }
  const worker=read('worker/index.ts')
  assert.match(worker,/No legacy \.html, \.data\.js/)
  assert.match(worker,/verifyAccess\(request,env\)/)
})
