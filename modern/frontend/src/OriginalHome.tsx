import {useEffect,useMemo,useState} from 'react'
import parse from 'html-react-parser'
import {learningJson} from './MyPage'
import {safeLessonHtml} from './LessonPage'

type HomeData={title:string;html:string;sourcePath:string;revision:number}
interface Catalog{lessons:Array<{slug:string;title:string;source_path:string}>;quizzes:Array<{slug:string;title:string;legacy_path:string|null}>}

export default function OriginalHome({teacher}:{teacher:boolean}){
  const [home,setHome]=useState<HomeData|null>(null)
  const [catalog,setCatalog]=useState<Catalog|null>(null)
  const [error,setError]=useState('')
  const [ready,setReady]=useState(false)
  useEffect(()=>{
    const previousClass=document.body.className
    document.body.className='course-ui'
    let disposed=false
    void Promise.all([
      learningJson<HomeData>('/api/content/home'),
      learningJson<Catalog>('/api/content/catalog'),
      import('./original-css/pages/index.css'),
    ]).then(([page,index])=>{
      if(disposed)return
      setHome(page)
      setCatalog(index as Catalog)
      setReady(true)
      document.title='찐망고 Frontend Lab | AI·웹디자인·퍼블리싱 강의와 퀴즈'
    }).catch(e=>{
      if(!disposed)setError(e instanceof Error?e.message:'강의실을 불러오지 못했습니다.')
    })
    return()=>{disposed=true;document.body.className=previousClass}
  },[])
  const content=useMemo(()=>{
    if(!home)return ''
    const safe=safeLessonHtml(home.html,'/',catalog)
    // Only append vetted static links to the existing original navigation.
    // Avoid mutating foreign DOM implementations in Worker + browser type unions.
    const extra='<a class="nav-link" href="/me">마이페이지</a>'+
      (teacher?'<a class="nav-link" href="/admin">강의 관리</a>':'')
    return safe.replace(/(<nav\b[^>]*class=["'][^"']*nav-links[^"']*["'][^>]*>[\s\S]*?)(<\/nav>)/i,
      (_,begin,end)=>begin+extra+end)
  },[home,catalog,teacher])
  if(error)return <main className="onboard-shell" role="alert">{error}</main>
  if(!ready)return <main className="onboard-shell" aria-live="polite">Frontend Lab을 불러오는 중입니다…</main>
  return <>{parse(content)}</>
}
