import {useEffect,useMemo,useState} from 'react'
import {ScoreLine,Metric,learningJson} from './MyPage'
import './learning.css'
interface Overview {
  summary:{students:number;active_students:number;attempts:number;average_score:number}
  students:Array<{student_id:string|null;student_name:string;email:string;created_at:string;attempts:number;average_score:number|null;best_score:number|null;last_attempt:string|null}>
  quizzes:Array<{quiz_key:string;quiz_title:string;quiz_kind:string;attempts:number;average_score:number|null}>
  recent:Array<{attempt_id:string;quiz_title:string;score_percent:number;submitted_at:string;student_name:string;student_id:string|null}>
  days:Array<{day:string;attempts:number;average_score:number}>
}
interface StudentDetail{profile:{student_id:string;student_name:string;email:string;created_at:string};
  attempts:Array<{attempt_id:string;quiz_title:string;quiz_kind:string;score_percent:number;correct_count:number;total_count:number;submitted_at:string}>}
const score=(v:number|null|undefined)=>v===null||v===undefined?'—':v+'점'
const time=(v:string|null)=>v?v.replace('T',' ').slice(0,16):'기록 없음'
export default function TeacherAnalytics(){
  const [overview,setOverview]=useState<Overview|null>(null)
  const [selected,setSelected]=useState<StudentDetail|null>(null)
  const [query,setQuery]=useState('')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(true)
  async function refresh(){
    setError('')
    try{setOverview(await learningJson<Overview>('/api/admin/learning'))}
    catch(e){setError(e instanceof Error?e.message:'통계를 불러오지 못했습니다.')}
    finally{setBusy(false)}
  }
  useEffect(()=>{void refresh()},[])
  async function showStudent(id:string|null){
    if(!id)return
    try{
      setError('')
      const d=await learningJson<StudentDetail>('/api/admin/learning/student?studentId='+encodeURIComponent(id))
      setSelected(d)
    }catch(e){setError(e instanceof Error?e.message:'학생 기록을 찾지 못했습니다.')}
  }
  const students=useMemo(()=>overview?.students.filter(x=>
    (x.student_name+' '+x.email+' '+(x.student_id??'')).toLowerCase().includes(query.toLowerCase().trim()))??[],[overview,query])
  const trend=useMemo(()=>overview?.days.map(d=>({label:d.day.slice(5),value:d.average_score??0}))??[],[overview])
  return <section className="lab-analytics" aria-label="학습 현황 대시보드">
    <div className="lab-section-heading"><div><span className="lab-eyebrow">LEARNING ANALYTICS</span>
      <h2>학습 운영 현황</h2><p>학생별 점수와 퀴즈 성취도를 한 곳에서 확인합니다.</p></div>
      <button className="lab-button" type="button" onClick={()=>void refresh()} disabled={busy}>새로고침</button></div>
    {error&&<p role="alert" className="lab-alert">{error}</p>}
    {busy&&!overview?<p>통계 데이터를 읽는 중입니다…</p>:overview&&<>
      <div className="lab-metrics">
        <Metric label="등록 학생" value={overview.summary.students??0} hint="별도 이름 등록 기준"/>
        <Metric label="활동 학생" value={overview.summary.active_students??0} hint="점수 제출 기록 보유"/>
        <Metric label="총 응시" value={overview.summary.attempts??0} hint="누적 학습 기록"/>
        <Metric label="평균 점수" value={(overview.summary.average_score??0)+'점'} hint="모든 응시 기록 기준"/>
      </div>
      <div className="lab-two">
        <div className="lab-panel"><div className="lab-panel-header"><h3>학습 성취도 추이</h3><small>최근 14일 · 일별 평균</small></div>
          <ScoreLine points={trend}/></div>
        <div className="lab-panel"><div className="lab-panel-header"><h3>문제별 평균 점수</h3><small>응시가 있는 퀴즈</small></div>
          {overview.quizzes.length?<div className="lab-barlist">
            {overview.quizzes.slice(0,10).map(q=><div className="lab-bar-item" key={q.quiz_key}>
              <div><span title={q.quiz_title}>{q.quiz_title}</span><strong>{score(q.average_score)}</strong></div>
              <div className="lab-track"><span style={{width:Math.min(100,q.average_score??0)+'%'}}/></div>
              <small>{q.attempts}회 응시 · {q.quiz_kind==='legacy'?'기존 퀴즈':'관리형 퀴즈'}</small>
            </div>)}
          </div>:<p className="lab-empty">학생이 퀴즈를 풀면 통계가 자동으로 채워집니다.</p>}
        </div>
      </div>
      <section className="lab-panel">
        <div className="lab-panel-header"><div><h3>학생별 성적</h3><small>{overview.students.length}명 · 이름·이메일·ID 검색</small></div>
          <label className="lab-search"><span className="lab-visually-hidden">학생 검색</span>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="학생 검색"/></label></div>
        <div className="lab-scroll"><table className="lab-table">
          <thead><tr><th>학생</th><th>고유 ID</th><th>응시</th><th>평균</th><th>최고</th><th>최근 기록</th><th></th></tr></thead>
          <tbody>{students.map(s=><tr key={s.email}>
            <td><strong>{s.student_name}</strong><small className="lab-table-secondary">{s.email}</small></td>
            <td><code className="lab-small-code">{s.student_id??'미발급'}</code></td>
            <td>{s.attempts}</td><td>{score(s.average_score)}</td><td>{score(s.best_score)}</td><td>{time(s.last_attempt)}</td>
            <td><button className="lab-link-button" type="button" disabled={!s.student_id}
              onClick={()=>void showStudent(s.student_id)}>상세</button></td>
          </tr>)}</tbody>
        </table></div>
        {!students.length&&<p className="lab-empty">일치하는 학생이 없습니다.</p>}
      </section>
      <section className="lab-panel"><div className="lab-panel-header"><h3>최근 점수 제출</h3><small>최신 30건</small></div>
        {overview.recent.length?<div className="lab-scroll"><table className="lab-table">
          <thead><tr><th>학생</th><th>문제</th><th>점수</th><th>제출일</th></tr></thead>
          <tbody>{overview.recent.map(r=><tr key={r.attempt_id}>
            <td>{r.student_name}</td><td>{r.quiz_title}</td><td><strong>{r.score_percent}점</strong></td><td>{time(r.submitted_at)}</td>
          </tr>)}</tbody></table></div>:<p className="lab-empty">아직 응시 기록이 없습니다.</p>}
      </section>
    </>}
    {selected&&<div className="lab-modal-layer" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
      <section className="lab-modal" role="dialog" aria-modal="true" aria-label="학생 개별 학습 기록">
        <div className="lab-panel-header"><div><span className="lab-eyebrow">STUDENT REPORT</span>
          <h2>{selected.profile.student_name}</h2><small>{selected.profile.email}</small></div>
          <button className="lab-button" type="button" onClick={()=>setSelected(null)} aria-label="닫기">닫기</button></div>
        <p><span className="lab-meta-label">학생 ID</span><br/><code>{selected.profile.student_id}</code></p>
        <h3>개인 학습 기록</h3>
        <div className="lab-scroll"><table className="lab-table"><thead><tr><th>문제</th><th>점수</th><th>정답</th><th>날짜</th></tr></thead>
          <tbody>{selected.attempts.map(a=><tr key={a.attempt_id}>
            <td>{a.quiz_title}</td><td>{a.score_percent}</td><td>{a.correct_count}/{a.total_count}</td><td>{time(a.submitted_at)}</td>
          </tr>)}</tbody></table></div>
        {!selected.attempts.length&&<p className="lab-empty">해당 학생의 응시 기록이 없습니다.</p>}
      </section>
    </div>}
  </section>
}
