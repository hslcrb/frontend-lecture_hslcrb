import {useEffect,useMemo,useState} from 'react'
import parse from 'html-react-parser'
import {learningJson} from './MyPage'
import './native.css'

interface Lesson {
  slug:string;title:string;category:string;summary:string;html:string;
  sourcePath:string;revision:number
}
interface Catalogue{
  lessons:Array<{slug:string;title:string;source_path:string}>
  quizzes:Array<{slug:string;title:string;legacy_path:string|null}>
}
/**
 * Legacy course text is stored in D1, not in a static HTML route.
 * Render through React only after stripping executable markup and handlers.
 */
export function safeLessonHtml(html:string,sourcePath:string,catalog:Catalogue|null):string{
  const documentObject=new DOMParser().parseFromString(html,'text/html')
  documentObject.querySelectorAll(
    'script,iframe,object,embed,form,input,button,select,textarea,style,link,meta,base,svg,math,template'
  ).forEach(element=>element.remove())
  const root=documentObject.body
  const lookup=new Map<string,string>()
  for(const lesson of catalog?.lessons??[])lookup.set(lesson.source_path,'/learn/'+lesson.slug)
  for(const quiz of catalog?.quizzes??[])if(quiz.legacy_path)lookup.set(quiz.legacy_path,'/practice/'+quiz.slug)
  for(const el of Array.from(root.querySelectorAll('*'))){
    for(const attr of Array.from(el.attributes)){
      const name=attr.name.toLowerCase()
      if(name.startsWith('on')||name==='srcdoc'||name==='style'||name==='formaction'){
        el.removeAttribute(attr.name);continue
      }
      if(name==='href'||name==='src'||name==='poster'){
        const raw=attr.value.trim()
        if(raw.startsWith('#'))continue
        try{
          const candidate=new URL(raw,new URL(sourcePath,window.location.origin))
          if(!['http:','https:'].includes(candidate.protocol)){
            el.removeAttribute(attr.name);continue
          }
          if(candidate.origin===window.location.origin){
            const routed=lookup.get(candidate.pathname)
            el.setAttribute(attr.name,routed? routed+candidate.hash : candidate.pathname+candidate.search+candidate.hash)
          }else if(name==='href') {
            el.setAttribute('rel','noopener noreferrer')
          }else {
            // Remote images are permitted, never remote scripts or executable embeds.
            if(el.tagName!=='IMG')el.removeAttribute(attr.name)
          }
        }catch{el.removeAttribute(attr.name)}
      }
    }
  }
  return root.innerHTML
}

export default function LessonPage(){
  const slug=window.location.pathname.split('/').filter(Boolean)[1]??''
  const [data,setData]=useState<Lesson|null>(null)
  const [catalog,setCatalog]=useState<Catalogue|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  useEffect(()=>{
    let disposed=false
    void Promise.all([
      learningJson<Lesson>('/api/content/lesson/'+encodeURIComponent(slug)),
      learningJson<Catalogue>('/api/content/catalog')
    ]).then(([lesson,items])=>{if(!disposed){setData(lesson);setCatalog(items);setLoading(false)}})
      .catch(e=>{if(!disposed){setError(e instanceof Error?e.message:'강의를 불러올 수 없습니다.');setLoading(false)}})
    return()=>{disposed=true}
  },[slug])
  const body=useMemo(()=>data?safeLessonHtml(data.html,data.sourcePath,catalog):'',[data,catalog])
  useEffect(()=>{if(data)document.title=data.title+' · Frontend Lab'},[data])
  if(loading)return <main className="native-page"><p>강의를 불러오는 중입니다…</p></main>
  if(!data)return <main className="native-page"><a href="/">강의실</a><p role="alert">{error}</p></main>
  return <main className="native-page">
    <header className="native-topbar">
      <a className="native-logo" href="/">Frontend Lab</a>
      <nav aria-label="학습 이동"><a href="/">전체 강의</a><a href="/me">마이페이지</a></nav>
    </header>
    <div className="native-lesson-layout">
      <aside className="native-lesson-rail">
        <span className="native-overline">{data.category}</span>
        <h1>{data.title}</h1>
        {data.summary&&<p>{data.summary}</p>}
        <p className="native-meta">강의 콘텐츠 · 업데이트 버전 {data.revision}</p>
        <a href="/">다른 강의 보기</a>
      </aside>
      <article className="native-reading-content course-ui" aria-label="강의 본문">
        {parse(body)}
      </article>
    </div>
    <footer className="native-foot">Frontend Lab · 수업 자료</footer>
  </main>
}
