import {useEffect,useState,type FormEvent} from 'react'
import AdminConsole from './Admin'

type Mode='loading'|'setup'|'login'|'forgot'|'reset'|'authorized'|'denied'
type TeacherStatus={configured:boolean;authenticated:boolean;email:string}
async function call<T>(route:string, payload?:Record<string,unknown>):Promise<T> {
  const result=await fetch(route,{
    method:payload?'POST':'GET',credentials:'same-origin',cache:'no-store',
    headers:payload?{'Content-Type':'application/json','X-Frontend-Lab':'teacher-auth'}:{},
    body:payload?JSON.stringify(payload):undefined,
  })
  const body=await result.json().catch(()=>({})) as Record<string,unknown>
  if(!result.ok)throw new Error(typeof body.error==='string'?body.error:'요청 오류 ('+result.status+')')
  return body as T
}

export default function TeacherGate() {
  const [mode,setMode]=useState<Mode>('loading')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [confirm,setConfirm]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [resetToken,setResetToken]=useState('')
  useEffect(()=>{
    let closed=false
    async function init(){
      try {
        const status=await call<TeacherStatus>('/api/teacher/status')
        if(closed)return
        setEmail(status.email)
        const fragment=new URLSearchParams(window.location.hash.slice(1))
        const token=fragment.get('reset')
        if(token&&/^[a-zA-Z0-9_-]{40,50}$/.test(token)){
          setResetToken(token)
          setMode('reset')
        }else setMode(status.authenticated?'authorized':status.configured?'login':'setup')
      }catch(e){if(!closed){setError(e instanceof Error?e.message:'관리자 인증 오류');setMode('denied')}}
    }
    void init()
    return()=>{closed=true}
  },[])
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault()
    if(busy)return
    setError('');setNotice('')
    if((mode==='setup'||mode==='reset') && password!==confirm){
      setError('비밀번호 확인이 일치하지 않습니다.');return
    }
    if((mode==='setup'||mode==='reset') && [...password].length<12){
      setError('비밀번호는 최소 12자로 입력해 주세요.');return
    }
    setBusy(true)
    try{
      if(mode==='login'){
        await call('/api/teacher/login',{password})
        setMode('authorized')
      }else if(mode==='setup'){
        await call('/api/teacher/setup',{password})
        setMode('authorized')
      }else if(mode==='reset'){
        await call('/api/teacher/reset/confirm',{password,token:resetToken})
        // Clear the sensitive fragment once the token is consumed.
        window.history.replaceState(null,'',window.location.pathname)
        setResetToken('')
        setMode('authorized')
      }
      setPassword('');setConfirm('')
    }catch(e){setError(e instanceof Error?e.message:'인증을 완료하지 못했습니다.')}
    finally{setBusy(false)}
  }
  async function requestReset(){
    if(busy)return
    setBusy(true);setError('');setNotice('')
    try{
      const msg=await call<{message:string}>('/api/teacher/reset/request',{})
      setNotice(msg.message)
      setMode('forgot')
    }catch(e){setError(e instanceof Error?e.message:'메일 전송 오류')}
    finally{setBusy(false)}
  }
  async function logout(){
    setBusy(true)
    try{await call('/api/teacher/logout',{});setMode('login')}
    catch(e){setError(e instanceof Error?e.message:'로그아웃 실패')}
    finally{setBusy(false)}
  }
  if(mode==='authorized')return <><div className="teacher-session">
    <span>관리자 2단계 인증 완료 · {email}</span>
    <button type="button" disabled={busy} onClick={()=>void logout()}>관리자 로그아웃</button>
  </div><AdminConsole/></>
  if(mode==='loading')return <main className="onboard-shell" aria-live="polite">선생님 인증 상태를 확인하고 있습니다…</main>
  if(mode==='denied')return <main className="onboard-shell"><section className="onboard-panel">
    <span className="onboard-kicker">TEACHER ACCESS</span><h1>관리자 접근 제한</h1>
    <p role="alert" className="onboard-error">{error}</p><p>이 공간은 지정된 선생님 Google 계정 전용입니다.</p>
    <a href="/">학생 강의실로 돌아가기</a>
  </section></main>
  return <main className="onboard-shell">
    <section className="onboard-panel" aria-labelledby="teacher-title">
      <span className="onboard-kicker">FRONTEND LAB · TEACHER</span>
      <h1 id="teacher-title">{mode==='setup'?'관리자 비밀번호 최초 설정':mode==='reset'?'비밀번호 재설정':mode==='forgot'?'이메일 인증':'선생님 2차 인증'}</h1>
      <p>{mode==='setup'?'Google 계정 확인이 끝났습니다. 관리자 비밀번호를 처음 한 번 설정하면 D1에 해시로 저장됩니다.':
         mode==='reset'?'선생님 이메일로 발급받은 일회용 링크입니다. 새 비밀번호를 입력해 주세요.':
         mode==='forgot'?'등록된 선생님 이메일로 일회용 확인 링크를 보내드립니다. 링크는 15분 동안 한 번만 사용할 수 있습니다.':
         '관리자 페이지에 들어가려면 Google 로그인 외에 비밀번호가 한 번 더 필요합니다.'}</p>
      <p className="onboard-account">Google 인증 계정: <strong>{email}</strong></p>
      {mode!=='forgot'?<form onSubmit={submit}>
        <label htmlFor="teacher-password">{mode==='login'?'관리자 비밀번호':'새 관리자 비밀번호'}</label>
        <input type="password" id="teacher-password" autoComplete={mode==='login'?'current-password':'new-password'}
          value={password} onChange={e=>setPassword(e.target.value)} required
          minLength={mode==='login'?undefined:12} maxLength={128}/>
        {mode!=='login'&&<>
          <label htmlFor="teacher-confirm">비밀번호 확인</label>
          <input type="password" id="teacher-confirm" autoComplete="new-password" value={confirm}
            onChange={e=>setConfirm(e.target.value)} minLength={12} maxLength={128} required/>
          <small>12~128자 · 재배포 후에도 유지 · 비밀번호 원문은 서버에 저장하지 않습니다.</small>
        </>}
        {error&&<p role="alert" className="onboard-error">{error}</p>}
        <button type="submit" disabled={busy||!password}>{busy?'처리 중…':mode==='login'?'관리자 로그인':mode==='setup'?'비밀번호 설정하고 입장':'새 비밀번호 저장'}</button>
      </form>:<>
        {notice&&<p role="status" className="teacher-notice">{notice}</p>}
        {error&&<p role="alert" className="onboard-error">{error}</p>}
        <button type="button" disabled={busy} onClick={()=>void requestReset()}>{busy?'전송 중…':'선생님 이메일로 재설정 링크 전송'}</button>
      </>}
      <div className="teacher-options">
        {mode==='login'&&<button type="button" className="teacher-textbutton" onClick={()=>{setMode('forgot');setError('')}}>비밀번호를 잊으셨나요?</button>}
        {mode==='forgot'&&<button type="button" className="teacher-textbutton" onClick={()=>{setMode('login');setNotice('');setError('')}}>비밀번호 입력으로 돌아가기</button>}
        <a href="/">학생 화면</a>
      </div>
    </section>
  </main>
}
