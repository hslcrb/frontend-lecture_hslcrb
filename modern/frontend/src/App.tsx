import { useEffect, useState, type FormEvent } from 'react'
import TeacherGate from './TeacherGate'
import parse, { Element } from 'html-react-parser'

interface Session {
  authenticated: boolean
  registered: boolean
  email: string
  studentName: string | null
}
type Phase = 'loading' | 'register' | 'home' | 'error'

const iconNames: Record<string,string> = {
  '📐':'grid', '🧩':'puzzle', '🎨':'palette', '📏':'ruler',
  '📦':'box', '🔗':'link', '⚖️':'scale', '📝':'notes', '✍️':'pen',
  '🖼️':'image', '🎯':'target', '💻':'computer', '🧠':'brain',
  '🚀':'rocket', '📚':'book', '💡':'lightbulb', '🧪':'flask',
  '🔢':'numbers', '🎓':'graduation', '📱':'phone', '🖌️':'paintbrush',
  '📊':'chart', '🗂️':'folder', '📌':'pin', '🌊':'wave',
  '⚡':'bolt', '➕':'add', '❓':'question', '🔄':'refresh',
  '👁️':'eye', '📖':'open-book',
}
async function requestJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials:'same-origin', cache:'no-store', ...options })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : '요청 오류: ' + response.status)
  return data as T
}
function originalBody(html: string) {
  // Keep the upstream markup and CSS classes. Replace only glyphs, not the card layout.
  return parse(html, {
    replace(node) {
      if (!(node instanceof Element) || node.name !== 'span') return undefined
      const cls = node.attribs?.class ?? ''
      if (!cls.split(/\s+/).includes('card-icon')) return undefined
      const label = node.children.map(child => child.type === 'text' ? child.data : '').join('').trim()
      const icon = iconNames[label]
      if (!icon) return undefined
      return <span className={cls} aria-hidden="true">
        <img className="custom-card-icon" src={'/ui/icons/' + icon + '.svg'} alt="" draggable={false}/>
      </span>
    },
  })
}
function StudentApp() {
  const [phase,setPhase] = useState<Phase>('loading')
  const [session,setSession] = useState<Session|null>(null)
  const [name,setName] = useState('')
  const [home,setHome] = useState('')
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  useEffect(() => {
    let abandoned = false
    async function initialize() {
      try {
        const next = await requestJSON<Session>('/api/session')
        if (abandoned) return
        setSession(next)
        if (!next.registered) { setPhase('register'); return }
        const page = await requestJSON<{ html: string }>('/api/home')
        if (!abandoned) { setHome(page.html); setPhase('home') }
      } catch(e) {
        if (!abandoned) { setError(e instanceof Error ? e.message : '사이트를 불러오지 못했습니다.'); setPhase('error') }
      }
    }
    void initialize()
    return () => { abandoned = true }
  }, [])
  useEffect(() => {
    document.body.classList.toggle('course-ui',phase==='home')
    return () => document.body.classList.remove('course-ui')
  },[phase])
  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true);setError('')
    try {
      await requestJSON('/api/profile',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Frontend-Lab':'profile'},
        body:JSON.stringify({studentName:name.trim()}),
      })
      // Refetch all original CSS after onboarding; it is protected until enrollment.
      window.location.reload()
    } catch(e) { setError(e instanceof Error ? e.message : '등록에 실패했습니다.') }
    finally { setBusy(false) }
  }
  if (phase==='loading') return <main className="onboard-shell" aria-live="polite">강의실을 준비하고 있습니다…</main>
  if (phase==='error') return <main className="onboard-shell"><section className="onboard-panel">
    <h1>접속 확인이 필요합니다</h1><p role="alert">{error}</p>
    <button type="button" onClick={()=>window.location.reload()}>다시 확인</button>
  </section></main>
  if (phase==='register') return <main className="onboard-shell"><section className="onboard-panel" aria-labelledby="name-title">
    <p className="onboard-kicker">JJinMangGo · Frontend Lab</p>
    <h1 id="name-title">학생 이름 등록</h1>
    <p>로그인은 완료되었습니다. 강의실에서 사용할 이름을 별도로 입력해 주세요.</p>
    <p className="onboard-account">로그인 계정: <strong>{session?.email}</strong></p>
    <form onSubmit={register}>
      <label htmlFor="studentName">학생 이름</label>
      <input id="studentName" autoComplete="name" maxLength={40}
        value={name} onChange={event=>setName(event.target.value)}
        required placeholder="이름 입력" aria-describedby="nameHelp"/>
      <small id="nameHelp">2~40자 · Google 계정에 연결해 보관됩니다.</small>
      {error && <p role="alert" className="onboard-error">{error}</p>}
      <button type="submit" disabled={busy || [...name.trim()].length<2}>
        {busy?'등록 중…':'강의실 입장'}
      </button>
    </form>
    <p className="onboard-help">등록된 이름은 학습 운영 목적으로 저장됩니다. 실제 이름을 입력해 주세요.</p>
  </section></main>
  return <>{originalBody(home)}</>
}

export default function App() {
  return window.location.pathname.startsWith("/admin") ? <TeacherGate/> : <StudentApp/>
}
