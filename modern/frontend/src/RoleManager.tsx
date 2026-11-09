import {useEffect,useMemo,useState} from 'react'
import './learning.css'

interface ManagedAccount{
  access_subject:string;student_name:string;email:string;student_id:string|null
  created_at:string;role:'creator'|'teacher'|'admin'|'student'
  granted_at:string|null;revoked_at:string|null
}
interface AuditEntry{id:number;actor_email:string;target_email:string;action:'grant'|'revoke';recorded_at:string}
interface Directory{creator:string;teacher:string;students:ManagedAccount[];audit:AuditEntry[]}
type Action='grant'|'revoke'
async function request<T>(url:string,init?:RequestInit):Promise<T>{
  const response=await fetch(url,{cache:'no-store',credentials:'same-origin',...init})
  const obj=await response.json().catch(()=>({})) as Record<string,unknown>
  if(!response.ok)throw new Error(typeof obj.error==='string'?obj.error:'관리자 권한 요청을 처리하지 못했습니다.')
  return obj as T
}
const descriptions:Record<ManagedAccount['role'],string>={
  creator:'0순위 · 창조자',teacher:'1순위 · 선생님',
  admin:'2순위 · 임명 관리자',student:'일반 학생'
}
export default function RoleManager(){
  const [data,setData]=useState<Directory|null>(null)
  const [query,setQuery]=useState('')
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const filtered=useMemo(()=>data?.students.filter(student=>
    [student.student_name,student.email,student.student_id??''].some(str=>
      str.toLowerCase().includes(query.trim().toLowerCase())))??[],[data,query])
  async function refresh(){
    setError('')
    try{setData(await request<Directory>('/api/admin/roles'))}
    catch(e){setError(e instanceof Error?e.message:'권한 정보를 조회하지 못했습니다.')}
  }
  useEffect(()=>{void refresh()},[])
  async function change(user:ManagedAccount,action:Action){
    const label=action==='grant'?'관리자 권한을 부여':'관리자 권한을 박탈'
    if(!window.confirm(user.student_name+' ('+user.email+') 계정에 '+label+'할까요?'))return
    setBusy(user.access_subject);setNotice('');setError('')
    try{
      await request('/api/admin/roles',{
        method:'POST',headers:{'Content-Type':'application/json','X-Frontend-Lab':'role-write'},
        body:JSON.stringify({action,accessSubject:user.access_subject}),
      })
      await refresh()
      setNotice(user.student_name+' 계정의 관리자 권한이 변경되었습니다.')
    }catch(e){setError(e instanceof Error?e.message:'권한 변경 실패')}
    finally{setBusy('')}
  }
  return <section className="lab-role-manager" aria-labelledby="br-roles-title">
    <div className="lab-section-heading"><div>
      <span className="lab-eyebrow">CREATOR CONTROL</span>
      <h2 id="br-roles-title">권한 및 구성원</h2>
      <p>관리자 임명과 박탈은 0순위 창조자에게만 허용됩니다.</p>
    </div><button type="button" className="lab-button" onClick={()=>void refresh()}>새로고침</button></div>
    <div className="lab-two lab-rank-grid">
      <div className="lab-panel lab-rank-permanent">
        <span className="lab-eyebrow">RANK 00 · CREATOR</span>
        <h3>창조자</h3>
        <p>{data?.creator??'설정 확인 중'}</p>
        <small>최상위 권한 · 계정 임명 및 권한 철회 가능 · 해제 불가</small>
      </div>
      <div className="lab-panel lab-rank-permanent">
        <span className="lab-eyebrow">RANK 01 · TEACHER</span>
        <h3>선생님</h3>
        <p>{data?.teacher??'설정 확인 중'}</p>
        <small>기본 관리자 · 학습·문제·콘텐츠 관리 · 해제 불가</small>
      </div>
    </div>
    {error&&<p role="alert" className="lab-alert">{error}</p>}
    {notice&&<p role="status" className="lab-notice">{notice}</p>}
    <div className="lab-panel">
      <div className="lab-panel-header">
        <div><h3>가입된 계정</h3><small>{data?.students.length??0}명 · 가입한 사용자에게만 관리자 권한을 부여할 수 있습니다.</small></div>
        <label className="lab-search"><span className="lab-visually-hidden">계정 검색</span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="이름·이메일·학생 ID 검색"/></label>
      </div>
      {!data&&!error&&<p className="lab-empty">계정을 불러오는 중입니다…</p>}
      <div className="lab-scroll">
        <table className="lab-table">
          <thead><tr><th>사용자</th><th>고유 ID</th><th>권한 등급</th><th>권한 관리</th></tr></thead>
          <tbody>{filtered.map(user=>{
            const permanent=user.role==='creator'||user.role==='teacher'
            return <tr key={user.access_subject}>
              <td><strong>{user.student_name}</strong><small className="lab-table-secondary">{user.email}</small></td>
              <td><code className="lab-small-code">{user.student_id??'미발급'}</code></td>
              <td><span className={'lab-role-label '+user.role}>{descriptions[user.role]}</span></td>
              <td>{permanent?
                <span className="lab-muted">기본 권한 · 고정</span>:
                <button type="button" className={'lab-button '+(user.role==='admin'?'lab-role-revoke':'')}
                  disabled={Boolean(busy)} onClick={()=>void change(user,user.role==='admin'?'revoke':'grant')}>
                  {busy===user.access_subject?'처리 중…':user.role==='admin'?'권한 박탈':'관리자 임명'}
                </button>}</td>
            </tr>
          })}</tbody>
        </table>
      </div>
      {data&&!filtered.length&&<p className="lab-empty">일치하는 계정이 없습니다.</p>}
    </div>
    <div className="lab-panel">
      <div className="lab-panel-header"><h3>권한 변경 기록</h3><small>최근 35건 · 변경 이력은 D1에 저장</small></div>
      <div className="lab-scroll"><table className="lab-table">
        <thead><tr><th>작업</th><th>계정</th><th>실행자</th><th>시각</th></tr></thead>
        <tbody>{data?.audit.map(a=><tr key={a.id}>
          <td><strong>{a.action==='grant'?'관리자 임명':'권한 박탈'}</strong></td>
          <td>{a.target_email}</td><td>{a.actor_email}</td><td>{a.recorded_at}</td>
        </tr>)}</tbody>
      </table></div>
      {data&&!data.audit.length&&<p className="lab-empty">아직 권한 변경 이력이 없습니다.</p>}
    </div>
    <p className="lab-fineprint">고유 학생 ID는 로그인 인증 수단이 아닙니다. 관리자 권한은 Google 인증 계정과 별도 비밀번호 세션으로 확인합니다.</p>
  </section>
}
