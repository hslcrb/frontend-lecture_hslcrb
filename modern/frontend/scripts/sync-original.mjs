import fs from 'node:fs'
import vm from 'node:vm'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const defaultOutput = path.resolve(dir,'../public')
const sourceDirs = ['ai','assets','flex','grid','javascript','position','quiz','tailwind','uiux']
export const iconNames = {
  '📐':'grid', '🧩':'puzzle', '🎨':'palette', '📏':'ruler',
  '📦':'box', '🔗':'link', '⚖️':'scale', '📝':'notes', '✍️':'pen',
  '🖼️':'image', '🎯':'target', '💻':'computer', '🧠':'brain',
  '🚀':'rocket', '📚':'book', '💡':'lightbulb', '🧪':'flask',
  '🔢':'numbers', '🎓':'graduation', '📱':'phone', '🖌️':'paintbrush',
  '📊':'chart', '🗂️':'folder', '📌':'pin', '🌊':'wave',
  '⚡':'bolt', '➕':'add', '❓':'question', '🔄':'refresh',
  '👁️':'eye', '📖':'open-book',
}
export function findSourceRoot() {
  let p = path.resolve(process.env.SOURCE_REPO_ROOT || path.join(dir,'../../..'))
  for(let i=0;i<6;i++){
    if (fs.existsSync(path.join(p,'DESIGN.md')) &&
        fs.existsSync(path.join(p,'index.html')) &&
        fs.existsSync(path.join(p,'assets/css/tokens.css'))) return p
    const next = path.dirname(p)
    if (next===p) break
    p=next
  }
  throw new Error('Cannot find latest upstream sources: DESIGN.md, index.html, assets/css/tokens.css')
}
export function replaceCardEmojis(html) {
  return html.replace(/(<span\b[^>]*class=["'][^"']*\bcard-icon\b[^"']*["'][^>]*>)([^<]*)(<\/span>)/giu,
    (whole,opening,inner,closing) => {
      const icon = iconNames[inner.trim()]
      if(!icon)return whole
      return opening+'<img class="custom-card-icon" src="/ui/icons/'+icon+'.svg" alt="" aria-hidden="true">'+closing
    })
}
export function stripLegacyAnalytics(html) {
  return html.replace(/<script\b[^>]*src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js[^"']*["'][^>]*><\/script>\s*/giu,'')
    .replace(/<script>\s*window\.dataLayer\s*=\s*window\.dataLayer[\s\S]*?gtag\('config',[\s\S]*?<\/script>\s*/giu,'')
}
function updateCopiedHtml(dir) {
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const file = path.join(dir,e.name)
    if(e.isDirectory())updateCopiedHtml(file)
    else if(e.isFile() && /\.html?$/i.test(file)){
      const html = fs.readFileSync(file,'utf8')
      fs.writeFileSync(file,replaceCardEmojis(stripLegacyAnalytics(html)),'utf8')
    }
  }
}
function manifestEntries(root) {
  const items = [{path:'/',kind:'html',title:'Frontend Lab · 메인'}]
  for(const folder of sourceDirs){
    const top=path.join(root,folder)
    if(!fs.existsSync(top))continue
    const stack=[top]
    while(stack.length){
      const current=stack.pop()
      for(const entry of fs.readdirSync(current,{withFileTypes:true})){
        const file=path.join(current,entry.name)
        if(entry.isDirectory()){stack.push(file);continue}
        const ext=path.extname(file).toLowerCase()
        if(!['.html','.htm','.js','.css'].includes(ext))continue
        const relative=path.relative(root,file).split(path.sep).join('/')
        let title=relative
        if(ext==='.html'||ext==='.htm'){
          const s=fs.readFileSync(file,'utf8')
          const m=/<title[^>]*>([\s\S]*?)<\/title>/i.exec(s)
          if(m)title=m[1].replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').trim().slice(0,120)||relative
        }
        items.push({path:'/'+relative,kind:ext==='.css'?'css':ext==='.js'?'js':'html',title})
      }
    }
  }
  items.sort((a,b)=>a.path.localeCompare(b.path,'ko'))
  return {items,generatedAt:new Date().toISOString()}
}

/**
 * Original teaching quizzes are trusted source files. Build a *server-only*
 * answer-key catalog; do not expose it to users via the Worker route.
 * Actual legacy answer files already ship client-side because that's how
 * the original educational quizzes work. This is formative, not exam security.
 */
export function legacyQuizCatalog(root) {
  const items=[]
  for(const folder of sourceDirs) {
    const dir=path.join(root,folder)
    if(!fs.existsSync(dir))continue
    const walk=[dir]
    while(walk.length){
      const at=walk.pop()
      for(const e of fs.readdirSync(at,{withFileTypes:true})){
        const full=path.join(at,e.name)
        if(e.isDirectory()){walk.push(full);continue}
        if(!e.isFile()||!e.name.endsWith('.data.js'))continue
        const htmlFile=full.slice(0,-'.data.js'.length)+'.html'
        if(!fs.existsSync(htmlFile))continue
        const html=fs.readFileSync(htmlFile,'utf8')
        if(!html.includes('quiz-unified.js'))continue
        try{
          const scope={window:Object.create(null)}
          vm.runInNewContext(fs.readFileSync(full,'utf8'),scope,{timeout:200,
            filename:e.name})
          const questions=scope.window.QUIZ_DATA
          if(!Array.isArray(questions)||!questions.length||questions.length>100)continue
          const keys=questions.map(q=>{
            const ans=q.ans!==undefined?q.ans:q.answer
            if(q.type==='short'){
              if(typeof ans!=='string')throw new Error('Unsupported short answer')
              return {kind:'short',answer:ans}
            }
            if(typeof ans!=='number'||!Number.isInteger(ans))throw new Error('Unsupported choice answer')
            return {kind:'single',answer:ans}
          })
          const config=scope.window.QUIZ_CONFIG||{}
          const title=String(config.title||(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)||[])[1]||e.name).replace(/<[^>]+>/g,'').slice(0,120)
          items.push({path:'/'+path.relative(root,htmlFile).split(path.sep).join('/'),
            dataPath:'/'+path.relative(root,full).split(path.sep).join('/'),
            title,keys})
        }catch(e){
          console.warn('Skipping unsupported original quiz:',path.relative(root,full),e.message)
        }
      }
    }
  }
  return {items:items.sort((a,b)=>a.path.localeCompare(b.path,'ko'))}
}
function attachLegacyScoreRecorder(publicFolder) {
  const script=path.join(publicFolder,'assets/js/quiz-unified.js')
  if(!fs.existsSync(script))return
  let js=fs.readFileSync(script,'utf8')
  const state='let current=0,answers=new Array(arr.length).fill(null),showResult=false;'
  const place=" const review=document.getElementById('quiz-revisit');"
  const restart="current=0;answers=new Array(arr.length).fill(null);showResult=false;render()"
  if(!js.includes(state)||!js.includes(place)||!js.includes(restart))
    throw new Error('Unified original quiz controller signature changed; score bridge needs review')
  js=js.replace(state,state.replace('showResult=false;','showResult=false,resultSubmitted=false;'))
  const bridge=String.raw\` 
 if(!resultSubmitted){
   resultSubmitted=true;
   const message=document.createElement('p');message.className='quiz-record-note';
   message.setAttribute('role','status');message.textContent='학습 기록 저장 중…';
   root.querySelector('.quiz-score')?.append(message);
   fetch('/api/quiz/legacy/submit',{
     method:'POST',credentials:'same-origin',cache:'no-store',
     headers:{'Content-Type':'application/json','X-Frontend-Lab':'quiz-submit'},
     body:JSON.stringify({path:location.pathname,answers})
   }).then(async res=>{
     if(!res.ok)throw new Error('저장할 수 없는 퀴즈입니다.')
     message.textContent='학습 기록이 마이페이지에 저장됐습니다.'
   }).catch(()=>{message.textContent='기록을 저장하지 못했어요. 퀴즈 결과는 그대로 확인할 수 있습니다.'})
 }
\`;
  js=js.replace(place,bridge+place)
  js=js.replace(restart,"current=0;answers=new Array(arr.length).fill(null);showResult=false;resultSubmitted=false;render()")
  fs.writeFileSync(script,js,'utf8')
  const style=path.join(publicFolder,'assets/css/quiz-unified.css')
  if(fs.existsSync(style))fs.appendFileSync(style,'\n.quiz-record-note{margin:16px 0 0;color:#526079;font-size:13px;line-height:1.6}\n')
}

export function syncOriginal(root,output=defaultOutput) {
  if(!fs.existsSync(path.join(root,'DESIGN.md')))throw new Error('Invalid lecture repo')
  fs.mkdirSync(output,{recursive:true})
  for (const name of sourceDirs) {
    const source=path.join(root,name), target=path.join(output,name)
    if(!fs.existsSync(source))continue
    fs.rmSync(target,{recursive:true,force:true})
    fs.cpSync(source,target,{recursive:true,force:true})
    updateCopiedHtml(target)
  }
  if(fs.existsSync(path.join(root,'favicon.ico')))fs.copyFileSync(path.join(root,'favicon.ico'),path.join(output,'favicon.ico'))
  const html=stripLegacyAnalytics(fs.readFileSync(path.join(root,'index.html'),'utf8'))
  const match=/<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html)
  if(!match)throw new Error('Original homepage body missing')
  fs.writeFileSync(path.join(output,'original-home.html'),match[1],'utf8')
  fs.writeFileSync(path.join(output,'original-manifest.json'),JSON.stringify(manifestEntries(root),null,2),'utf8')
  fs.writeFileSync(path.join(output,'original-quiz-keys.json'),JSON.stringify(legacyQuizCatalog(root)),'utf8')
  attachLegacyScoreRecorder(output)
  return { copied:sourceDirs.filter(x=>fs.existsSync(path.join(root,x))),homeBytes:Buffer.byteLength(match[1]) }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(syncOriginal(findSourceRoot()),null,2))
}
