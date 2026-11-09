import {useEffect,useMemo,useState} from 'react'
import parse from 'html-react-parser'
import {learningJson} from './MyPage'
import AiLesson from './AiLesson'

interface Lesson {
  slug:string;title:string;category:string;summary:string;
  html:string;sourcePath:string;revision:number
}
interface Catalogue {
  lessons:Array<{slug:string;title:string;source_path:string}>
  quizzes:Array<{slug:string;title:string;legacy_path:string|null}>
}
/**
 * Convert server-stored course markup to safe React elements while keeping
 * the original DOM structure and CSS class names. No legacy executable JS
 * file is imported: lecture HTML is content, not a separate web app.
 */
export function safeLessonHtml(html:string,sourcePath:string,catalog:Catalogue|null):string {
  const doc=new DOMParser().parseFromString(html,'text/html')
  // Preserve original static demo markup, controls and SVG artwork; disallow execution.
  doc.querySelectorAll(
    'script,iframe,object,embed,style,link,meta,base,template,foreignObject,animate,set'
  ).forEach(el=>el.remove())
  for(const form of Array.from(doc.querySelectorAll('form'))){
    form.replaceWith(...Array.from(form.childNodes))
  }
  const lookup=new Map<string,string>()
  for(const item of catalog?.lessons??[])lookup.set(item.source_path,'/learn/'+item.slug)
  for(const item of catalog?.quizzes??[])if(item.legacy_path)
    lookup.set(item.legacy_path,'/practice/'+item.slug)
  for(const el of Array.from(doc.body.querySelectorAll('*'))){
    for(const attribute of Array.from(el.attributes)){
      const key=attribute.name.toLowerCase()
      if(key.startsWith('on')||key==='srcdoc'||key==='formaction'){
        el.removeAttribute(attribute.name)
        continue
      }
      if(key==='style'){
        const style=attribute.value
        if(style.length>4000||/(?:url\s*\(|@import|expression\s*\(|behavior\s*:|binding\s*:)/i.test(style))
          el.removeAttribute(attribute.name)
        continue
      }
      if(key==='href'||key==='src'||key==='poster'||key==='xlink:href'){
        const value=attribute.value.trim()
        if(value.startsWith('#'))continue
        try{
          const target=new URL(value,new URL(sourcePath,window.location.origin))
          if(!['https:','http:'].includes(target.protocol)){
            el.removeAttribute(attribute.name)
            continue
          }
          if(target.origin===window.location.origin){
            const route=lookup.get(target.pathname)
            el.setAttribute(attribute.name,route?route+target.hash:target.pathname+target.search+target.hash)
          }else if(key==='href'&&el.tagName==='A'){
            el.setAttribute('rel','noopener noreferrer')
          }else if(el.tagName!=='IMG'){
            el.removeAttribute(attribute.name)
          }
        }catch{el.removeAttribute(attribute.name)}
      }
    }
    if(el.tagName==='INPUT'){
      const field=el as HTMLInputElement
      if(field.type==='file'||field.type==='password')field.remove()
    }
  }
  return doc.body.innerHTML
}
const lazyStyles:Record<string,()=>Promise<unknown>>=import.meta.glob('./original-css/pages/*.css')
function cssKey(path:string){
  const relative=path.replace(/^\//,'').replace(/\.(?:html|htm)$/i,'').replace(/\//g,'--')
  const base='./original-css/pages/'+relative+'.css'
  if(lazyStyles[base])return base
  return './original-css/pages/'+relative+'-htm.css'
}
export default function LessonPage(){
  const slug=window.location.pathname.split('/').filter(Boolean)[1]??''
  const [data,setData]=useState<Lesson|null>(null)
  const [catalog,setCatalog]=useState<Catalogue|null>(null)
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    let disposed=false
    const previous=document.body.className
    const previousTitle=document.title
    void Promise.all([
      learningJson<Lesson>('/api/content/lesson/'+encodeURIComponent(slug)),
      learningJson<Catalogue>('/api/content/catalog')
    ]).then(async ([lesson,listing])=>{
      if(disposed)return
      if(/^\/uiux\//.test(lesson.sourcePath))document.body.className=
        'gestalt-page '+(lesson.sourcePath.includes('theory')?'gestalt-theory':'gestalt-home')
      else if(lesson.sourcePath.startsWith('/ai/'))document.body.className='ai-page'
      else document.body.className='course-ui'
      if(!lesson.sourcePath.startsWith('/ai/')){
        const key=cssKey(lesson.sourcePath)
        if(lazyStyles[key])await lazyStyles[key]()
      }
      if(disposed)return
      setData(lesson)
      setCatalog(listing)
      setLoading(false)
      document.title=lesson.title+' | Frontend Lab'
    }).catch(e=>{if(!disposed){setError(e instanceof Error?e.message:'강의를 불러오지 못했습니다.');setLoading(false)}})
    return()=>{disposed=true;document.body.className=previous;document.title=previousTitle}
  },[slug])
  const content=useMemo(()=>data?safeLessonHtml(data.html,data.sourcePath,catalog):'',[data,catalog])
  if(loading)return <main className="onboard-shell" aria-live="polite">강의를 불러오는 중입니다…</main>
  if(error||!data)return <main className="onboard-shell"><a href="/">Frontend Lab 홈</a>
    <p role="alert">{error||'강의를 찾을 수 없습니다.'}</p></main>
  if(/^ai-(?:index|step-\d{2})$/.test(data.slug))return <AiLesson data={data}/>
  // The surrounding source page shell (header/sidebar/layout) is included in D1 HTML.
  // Render these same elements through React instead of changing their hierarchy.
  return <>{parse(content)}</>
}
