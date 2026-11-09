import {useEffect,useMemo,useState} from 'react'
import './learning.css'

export interface MyAttempt {
  attempt_id:string;quiz_key:string;quiz_title:string;quiz_kind:string;
  score_percent:number;correct_count:number;total_count:number;submitted_at:string
}
interface StudentDetails{student_id:string;student_name:string;email:string;created_at:string}
interface PersonalSummary{
  student:StudentDetails
  overall:{count:number;average:number;best:number|null}
  attempts:MyAttempt[]
  subjects:Array<{quiz_key:string;quiz_title:string;attempts:number;best_score:number;average_score:number}>
}
export interface QuizCatalog{
  managed:Array<{slug:string;title:string;description:string;version:number;kind:string}>
  legacy:Array<{path:string;title:string;count:number;kind:string}>
}
export async function learningJson<T>(path:string,options?:RequestInit):Promise<T>{
  const res=await fetch(path,{credentials:'same-origin',cache:'no-store',...options})
  const body=await res.json().catch(()=>({})) as Record<string,unknown>
  if(!res.ok)throw new Error(typeof body.error==='string'?body.error:'학습 데이터를 불러올 수 없습니다. ('+res.status+')')
  return body as T
}
function dateLabel(value:string){const d=new Date(value.includes('T')?value:value.replace(' ','T')+'Z');return Number.isNaN(d.getTime())?value:d.toLocaleDateString('ko-KR',{month:'short',day:'numeric'})}
const asPercent=(v:number|null|undefined)=>typeof v==='number'?v+'%':'기록 없음'

export function ScoreLine({points}: {points:Array<{label:string;value:number}>}){
  const series=points.slice(-14)
  if(!series.length)return <div className="lab-empty">아직 표시할 학습 기록이 없어요.</div>
  const vals=series.map(x=>Math.max(0,Math.min(100,x.value)))
  const path=vals.map((n,i)=>{
    const x=22+ (series.length===1?240:i*480/(series.length-1))
    const y=151-n*1.27
    return (i===0?'M':'L')+x.toFixed(1)+' '+y.toFixed(1)
  }).join(' ')
  return <div className="lab-line-figure">
    <svg viewBox="0 0 530 170" role="img" aria-label={'점수 변화: '+series.map(x=>x.label+' '+x.value+'점').join(', ')}>
      {[0,25,50,75,100].map(n=><g key={n}>
        <line x1="22" y1={151-n*1.27} x2="514" y2={151-n*1.27} stroke="#e8edf5" strokeWidth="1"/>
        <text x="0" y={155-n*1.27} fill="#69758a" fontSize="10">{n}</text>
      </g>)}
      <path d={path} stroke="#3455d1" strokeWidth="2.7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {vals.map((v,i)=><circle key={i} cx={22+(series.length===1?240:i*480/(series.length-1))}
        cy={151-v*1.27} r="4" fill="#fff" stroke="#3455d1" strokeWidth="2"/>)}
    </svg>
    <div className="lab-chart-labels"><span>{series[0]?.label}</span><span>{series[series.length-1]?.label}</span></div>
  </div>
}
export function Metric({label,value,hint}:{label:string;value:string|number;hint?:string}) {
  return <div className="lab-metric">
    <span>{label}</span><strong>{value}</strong>{hint&&<small>{hint}</small>}
  </div>
}
export default function MyPage(){
  const [info,setInfo]=useState<PersonalSummary|null>(null)
  const [catalog,setCatalog]=useState<QuizCatalog|null>(null)
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    let canceled=false
    void Promise.all([learningJson<PersonalSummary>('/api/me'),learningJson<QuizCatalog>('/api/quiz/catalog')])
      .then(([profile,sets])=>{if(!canceled){setInfo(profile);setCatalog(sets);setLoading(false)}})
      .catch(e=>{if(!canceled){setError(e instanceof Error?e.message:'학습 기록 조회 실패');setLoading(false)}})
    return()=>{canceled=true}
  },[])
  const graph=useMemo(()=>info?.attempts.slice(0,14).reverse().map(x=>({label:dateLabel(x.submitted_at),value:x.score_percent}))??[],[info])
  if(loading)return <main className="lab-shell"><p aria-live="polite">마이페이지를 불러오는 중입니다…</p></main>
  if(error)return <main className="lab-shell"><a href="/">강의 홈</a><p className="lab-alert">{error}</p></main>
  if(!info)return null
  return <main className="lab-shell">
    <nav className="lab-topnav"><a href="/">Frontend Lab</a><span>학습 마이페이지</span></nav>
    <header className="lab-heading">
      <span className="lab-eyebrow">MY LEARNING</span>
      <h1>{info.student.student_name}님의 학습 기록</h1>
      <p>Google 계정에 연결된 개인 학습 현황입니다. 다른 학생에게는 공개되지 않아요.</p>
    </header>
    <section className="lab-profile-card">
      <div><span className="lab-meta-label">학생 고유 ID</span><div className="lab-student-id">{info.student.student_id}</div>
        <p>첫 등록 후 동일 Google 계정에 계속 연결됩니다.</p></div>
      <button type="button" className="lab-button" onClick={()=>{void navigator.clipboard?.writeText(info.student.student_id)}}>ID 복사</button>
    </section>
    <section className="lab-metrics" aria-label="학습 요약">
      <Metric label="응시 횟수" value={info.overall.count} hint="총 제출 기록"/>
      <Metric label="평균 점수" value={asPercent(info.overall.count?info.overall.average:null)} hint="응시 기록 기준"/>
      <Metric label="최고 점수" value={asPercent(info.overall.best)} hint="개인 최고 기록"/>
    </section>
    <div className="lab-two">
      <section className="lab-panel">
        <div className="lab-panel-header"><h2>점수 추이</h2><small>최근 14회</small></div>
        <ScoreLine points={graph}/>
      </section>
      <section className="lab-panel">
        <div className="lab-panel-header"><h2>과목별 기록</h2><small>최근 응시 기준</small></div>
        {info.subjects.length?<div className="lab-barlist">
          {info.subjects.slice(0,8).map(s=><div className="lab-bar-item" key={s.quiz_key}>
            <div><span>{s.quiz_title}</span><strong>{s.best_score}%</strong></div>
            <div className="lab-track"><span style={{width:s.best_score+'%'}}/></div>
          </div>)}
        </div>:<div className="lab-empty">퀴즈를 풀면 과목별 점수가 이곳에 표시됩니다.</div>}
      </section>
    </div>
    <section className="lab-panel">
      <div className="lab-panel-header"><h2>풀 수 있는 퀴즈</h2><small>기존 강의 + 새 퀴즈</small></div>
      <div className="lab-linkgrid">
        {catalog?.managed.map(q=><a className="lab-quiz-link" href={'/practice/'+q.slug} key={q.slug}>
          <span className="lab-quiz-type">NEW QUIZ</span><strong>{q.title}</strong>
          <span>{q.description||'새 학습 문제'}</span></a>)}
        {catalog?.legacy.map(q=><a className="lab-quiz-link" href={q.path} key={q.path}>
          <span className="lab-quiz-type">ORIGINAL</span><strong>{q.title}</strong><span>{q.count}문항</span></a>)}
      </div>
      {!catalog?.legacy.length&&!catalog?.managed.length&&<p className="lab-empty">현재 공개된 퀴즈가 없습니다.</p>}
    </section>
    <section className="lab-panel">
      <div className="lab-panel-header"><h2>최근 응시 이력</h2><small>본인 기록만 표시</small></div>
      {info.attempts.length?<div className="lab-scroll"><table className="lab-table"><thead><tr><th>문제</th><th>점수</th><th>정답</th><th>응시일</th></tr></thead>
        <tbody>{info.attempts.map(r=><tr key={r.attempt_id}><td>{r.quiz_title}</td>
          <td><strong>{r.score_percent}점</strong></td><td>{r.correct_count}/{r.total_count}</td><td>{dateLabel(r.submitted_at)}</td></tr>)}</tbody>
      </table></div>:<div className="lab-empty">아직 기록이 없습니다. 첫 퀴즈에 도전해 보세요.</div>}
    </section>
    <footer className="lab-footer">Frontend Lab · 학습용 점수입니다. 성적표나 공식 시험 결과를 의미하지 않습니다.</footer>
  </main>
}
