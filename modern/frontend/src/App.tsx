import {useEffect,useMemo,useState,type FormEvent} from 'react'
import TeacherGate from './TeacherGate'
import MyPage,{learningJson} from './MyPage'
import PracticeQuiz from './PracticeQuiz'
import LessonPage from './LessonPage'
import './native.css'

interface Session {
  authenticated:boolean;registered:boolean;email:string;studentName:string|null;
  teacher?:boolean;studentId?:string|null
}
interface LessonItem {
  slug:string;title:string;category:string;summary:string;source_path:string;
  revision:number;updated_at:string
}
interface QuizItem {
  slug:string;title:string;description:string;published_version:number;
  question_count:number;legacy_path?:string|null
}
interface Catalog{lessons:LessonItem[];quizzes:QuizItem[]}
type Phase='loading'|'register'|'ready'|'error'

function LibraryHome({session}:{session:Session}){
  const [catalog,setCatalog]=useState<Catalog|null>(null)
  const [search,setSearch]=useState('')
  const [category,setCategory]=useState('전체')
  const [error,setError]=useState('')
  useEffect(()=>{
    let canceled=false
    void learningJson<Catalog>('/api/content/catalog')
      .then(result=>{if(!canceled)setCatalog(result)})
      .catch(e=>{if(!canceled)setError(e instanceof Error?e.message:'강의 목록 조회 실패')})
    return()=>{canceled=true}
  },[])
  const categories=useMemo(()=>
    ['전체',...new Set(catalog?.lessons.map(x=>x.category).filter(Boolean)??[])],[catalog])
  const filter=search.trim().toLowerCase()
  const lessons=useMemo(()=>catalog?.lessons.filter(item=>
    (category==='전체'||item.category===category) &&
    (item.title+' '+item.summary+' '+item.category).toLowerCase().includes(filter))??[],[catalog,category,filter])
  const quizzes=useMemo(()=>catalog?.quizzes.filter(item=>
    (item.title+' '+item.description).toLowerCase().includes(filter))??[],[catalog,filter])
  return <div className="native-page">
    <header className="native-topbar"><a className="native-logo" href="/">Frontend Lab</a>
      <nav aria-label="학습 메뉴"><a href="/me">마이페이지</a>{session.teacher&&<a href="/admin">CMS</a>}</nav>
    </header>
    <main className="native-home">
      <div className="native-hero">
        <span className="native-overline">LEARNING SPACE</span>
        <h1>배움의 모든 과정, 한 공간에서.</h1>
        <p>{session.studentName}님, 강의를 선택하거나 문제를 풀어보세요. 학습 기록은 내 마이페이지에 저장됩니다.</p>
      </div>
      <div className="native-search-row">
        <label htmlFor="native-search" className="native-sr-only">강의와 문제 검색</label>
        <input id="native-search" placeholder="강의 또는 문제 검색" value={search} onChange={e=>setSearch(e.target.value)}/>
        <span>{catalog?catalog.lessons.length+'개 강의 · '+catalog.quizzes.length+'개 퀴즈':'콘텐츠를 불러오는 중'}</span>
      </div>
      {error&&<p role="alert" className="native-error">{error}</p>}
      <section className="native-section" aria-labelledby="native-lesson-heading">
        <div className="native-section-heading"><div><span className="native-overline">COURSES</span><h2 id="native-lesson-heading">강의</h2></div>
          <div className="native-filters" role="group" aria-label="강의 분류">
            {categories.map(name=><button key={name} type="button" className={category===name?'active':''}
              onClick={()=>setCategory(name)}>{name}</button>)}
          </div>
        </div>
        {!catalog?<p className="native-muted">강의를 불러오는 중입니다…</p>:
          lessons.length?<div className="native-course-grid">
            {lessons.map(item=><a key={item.slug} href={'/learn/'+item.slug} className="native-course-card">
              <span className="native-overline">{item.category}</span><h3>{item.title}</h3>
              <p>{item.summary||'강의 내용 확인하기'}</p><span className="native-card-bottom">강의 열기 <span aria-hidden="true">›</span></span>
            </a>)}
          </div>:<p className="native-muted">해당하는 강의가 없습니다.</p>}
      </section>
      <section className="native-section" aria-labelledby="native-quiz-heading">
        <div className="native-section-heading"><div><span className="native-overline">PRACTICE</span><h2 id="native-quiz-heading">문제풀이</h2></div></div>
        {!catalog?<p className="native-muted">문제 목록을 불러오는 중입니다…</p>:
          quizzes.length?<div className="native-course-grid">
            {quizzes.map(item=><a key={item.slug} href={'/practice/'+item.slug} className="native-course-card">
              <span className="native-overline">{item.question_count} QUESTIONS</span>
              <h3>{item.title}</h3><p>{item.description||'개념을 확인하고 점수를 기록하세요.'}</p>
              <span className="native-card-bottom">문제 풀기 <span aria-hidden="true">›</span></span>
            </a>)}
          </div>:<p className="native-muted">해당하는 문제가 없습니다.</p>}
      </section>
    </main>
    <footer className="native-foot">Frontend Lab · 학습 서비스</footer>
  </div>
}

function StudentApp(){
  const [phase,setPhase]=useState<Phase>('loading')
  const [session,setSession]=useState<Session|null>(null)
  const [name,setName]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  useEffect(()=>{
    let cancelled=false
    void learningJson<Session>('/api/session').then(data=>{
      if(cancelled)return
      setSession(data)
      setPhase(data.registered?'ready':'register')
    }).catch(e=>{if(!cancelled){setPhase('error');setError(e instanceof Error?e.message:'계정을 확인할 수 없습니다.')}})
    return()=>{cancelled=true}
  },[])
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault()
    if(busy)return
    setBusy(true);setError('')
    try{
      const data=await learningJson<{registered:boolean;studentName:string;studentId:string}>('/api/profile',{
        method:'POST',headers:{'Content-Type':'application/json','X-Frontend-Lab':'profile'},
        body:JSON.stringify({studentName:name})
      })
      setSession(old=>old?{...old,registered:true,studentName:data.studentName,studentId:data.studentId}:old)
      setPhase('ready')
    }catch(e){setError(e instanceof Error?e.message:'이름을 저장하지 못했습니다.')}
    finally{setBusy(false)}
  }
  if(phase==='loading')return <main className="onboard-shell" aria-live="polite">계정을 확인하고 있습니다…</main>
  if(phase==='error')return <main className="onboard-shell"><section className="onboard-panel">
    <h1>접속을 확인해 주세요</h1><p role="alert">{error}</p></section></main>
  if(phase==='register')return <main className="onboard-shell"><section className="onboard-panel">
    <span className="onboard-kicker">FRONTEND LAB</span><h1>강의실 시작하기</h1>
    <p>수업에서 사용할 이름을 등록해 주세요.</p>
    <form onSubmit={submit}>
      <label htmlFor="student-name">이름</label>
      <input id="student-name" autoComplete="name" value={name} maxLength={40} required
        onChange={e=>setName(e.target.value)} placeholder="이름 입력"/>
      {error&&<p role="alert" className="onboard-error">{error}</p>}
      <button disabled={busy||name.trim().length<2}>{busy?'등록 중…':'강의실 입장'}</button>
    </form></section></main>
  if(!session)return null
  const route=window.location.pathname
  if(route==='/me')return <MyPage/>
  if(route.startsWith('/practice/'))return <PracticeQuiz/>
  if(route.startsWith('/learn/'))return <LessonPage/>
  return <LibraryHome session={session}/>
}
export default function App(){
  return window.location.pathname.startsWith('/admin')?<TeacherGate/>:<StudentApp/>
}
