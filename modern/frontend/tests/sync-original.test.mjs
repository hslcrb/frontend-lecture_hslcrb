import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {replaceCardEmojis,stripLegacyAnalytics,syncOriginal} from '../scripts/sync-original.mjs'

test('replaces only card emoji, not headings, anchors or content',()=>{
  const html='<span class="card-icon">📐</span><h2 class="card-title">CSS Grid 강의자료</h2>'
  const result=replaceCardEmojis(html)
  assert.match(result,/\/ui\/icons\/grid\.svg/)
  assert.match(result,/class="card-title">CSS Grid 강의자료/)
})
test('removes only old analytics bootstrap, keeps quiz script',()=>{
  const html='<script src="https://www.googletagmanager.com/gtag/js?id=X"></script><script>window.dataLayer = window.dataLayer || []; gtag(\'config\',\'X\');</script><script src="/assets/js/quiz-unified.js"></script>'
  const result=stripLegacyAnalytics(html)
  assert.doesNotMatch(result,/googletagmanager/)
  assert.match(result,/quiz-unified\.js/)
})
test('copies HTML, HTM quiz files, CSS and source homepage without modifying original',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'lab-sync-'))
  const root=path.join(tmp,'repo'),pub=path.join(tmp,'public')
  try {
    fs.mkdirSync(path.join(root,'assets/css'),{recursive:true})
    fs.mkdirSync(path.join(root,'quiz'),{recursive:true})
    fs.mkdirSync(path.join(root,'javascript'),{recursive:true})
    fs.writeFileSync(path.join(root,'DESIGN.md'),'# design')
    fs.writeFileSync(path.join(root,'assets/css/tokens.css'),':root { --ink: #123; }')
    fs.writeFileSync(path.join(root,'quiz/x.html'),'<span class="card-icon">🧩</span>')
    fs.writeFileSync(path.join(root,'javascript/legacy.htm'),'<span class="card-icon">🎯</span>')
    fs.writeFileSync(path.join(root,'index.html'),'<body class="course-ui"><a href="quiz/x.html">Quiz</a></body>')
    syncOriginal(root,pub)
    assert.match(fs.readFileSync(path.join(pub,'quiz/x.html'),'utf8'),/puzzle\.svg/)
    assert.match(fs.readFileSync(path.join(pub,'javascript/legacy.htm'),'utf8'),/target\.svg/)
    assert.match(fs.readFileSync(path.join(pub,'original-home.html'),'utf8'),/quiz\/x\.html/)
    assert.match(fs.readFileSync(path.join(root,'quiz/x.html'),'utf8'),/🧩/)
    const manifest=JSON.parse(fs.readFileSync(path.join(pub,'original-manifest.json'),'utf8'))
    assert.ok(manifest.items.some(x=>x.path==='/quiz/x.html'&&x.kind==='html'))
    assert.ok(manifest.items.some(x=>x.path==='/javascript/legacy.htm'&&x.kind==='html'))
  } finally {fs.rmSync(tmp,{recursive:true,force:true})}
})
