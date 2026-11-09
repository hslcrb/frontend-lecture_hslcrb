import {useEffect,useState,type FormEvent} from 'react'
import OriginalHome from './OriginalHome'
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
  return <OriginalHome teacher={Boolean(session.teacher)}/>
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
