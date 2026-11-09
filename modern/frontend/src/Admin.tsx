import { useEffect, useMemo, useState } from 'react'
import './admin.css'

type Kind = 'html'|'css'|'js'
interface ManifestItem { path:string; kind:Kind; title:string }
interface EditedItem { path:string;kind:Kind;updated_at:string;has_published:number;hidden:number;has_pending_draft:number }
interface Page {
  path:string;kind:Kind;source:string;hidden:boolean;published:boolean;
  hasDraft:boolean;originalExists:boolean;updatedAt:string|null;publishedAt:string|null
}
interface Version {
  id:number;action:string;actor_email:string;created_at:string;previous_hidden:number;
}
async function api<T>(path:string,init?:RequestInit):Promise<T> {
  const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...init})
  const json=await response.json().catch(()=>({})) as Record<string,unknown>
  if(!response.ok)throw new Error(typeof json.error==='string'?json.error:'요청이 실패했습니다 ('+response.status+')')
  return json as T
}
export default function Admin() {
  const [files,setFiles]=useState<ManifestItem[]>([])
  const [edited,setEdited]=useState<EditedItem[]>([])
  const [selected,setSelected]=useState('/')
  const [page,setPage]=useState<Page|null>(null)
  const [source,setSource]=useState('')
  const [history,setHistory]=useState<Version[]>([])
  const [search,setSearch]=useState('')
  const [email,setEmail]=useState('')
  const [roster,setRoster]=useState<Array<{student_name:string;email:string;created_at:string}>>([])
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [ready,setReady]=useState(false)

  async function refreshList() {
    const data=await api<{original:{items:ManifestItem[]};edited:EditedItem[]}>('/api/admin/manifest')
    const combined=new Map<string,ManifestItem>()
    for(const item of data.original?.items??[]) combined.set(item.path,item)
    for(const item of data.edited??[])if(!combined.has(item.path))
      combined.set(item.path,{path:item.path,kind:item.kind,title:item.path})
    setFiles([...combined.values()].sort((a,b)=>a.path.localeCompare(b.path,'ko')))
    setEdited(data.edited??[])
  }
  async function load(path:string) {
    setError('')
    const query='?path='+encodeURIComponent(path)
    try {
      const [entry,versions]=await Promise.all([
        api<Page>('/api/admin/content'+query),
        api<{versions:Version[]}>('/api/admin/history'+query),
      ])
      setPage(entry)
      setSource(entry.source)
      setHistory(versions.versions)
    } catch(e) { setPage(null);setError(e instanceof Error?e.message:'자료 조회 실패') }
  }
  useEffect(()=>{
    let disposed=false
    async function start(){
      try{
        const me=await api<{email:string}>('/api/admin/me')
        if(disposed)return
        setEmail(me.email)
        await refreshList()
        const rosterData=await api<{students:Array<{student_name:string;email:string;created_at:string}>}>('/api/admin/students')
        if(!disposed){setRoster(rosterData.students??[]);setReady(true)}
      }catch(e){if(!disposed)setError(e instanceof Error?e.message:'관리자 인증을 확인할 수 없습니다.')}
    }
    void start()
    return()=>{disposed=true}
  },[])
  useEffect(()=>{if(ready)void load(selected)},[ready,selected])

  const visible=useMemo(()=>files.filter(item=>(item.path+' '+item.title).toLowerCase().includes(search.trim().toLowerCase())),[files,search])
  const status=edited.find(item=>item.path===selected)
  const unsaved=Boolean(page && page.source!==source)

  async function action(type:'saveDraft'|'publish'|'hide'|'show'|'restore',versionId?:number) {
    if(busy)return
    if(type==='restore'&&!window.confirm('선택한 이전 버전을 현재 게시본으로 복원할까요?'))return
    if(type==='hide'&&!window.confirm('학생 화면에서 이 자료를 숨길까요?'))return
    setBusy(true);setError('');setNotice('')
    const post=async(data:Record<string,unknown>)=>api<{ok:boolean}>('/api/admin/content',{
      method:'POST',headers:{'Content-Type':'application/json','X-Frontend-Lab':'cms-write'},
      body:JSON.stringify({path:selected,...data}),
    })
    try {
      if(type==='publish' && unsaved)await post({action:'saveDraft',source})
      if(type==='saveDraft')await post({action:'saveDraft',source})
      else await post({action:type,versionId})
      await Promise.all([load(selected),refreshList()])
      setNotice(type==='saveDraft'?'초안을 저장했습니다. 게시 버튼을 눌러 학생에게 적용하세요.':
        type==='publish'?'게시했습니다. 학생 페이지에 바로 반영됩니다.':
        type==='restore'?'이전 버전을 복원했습니다.':'공개 상태를 변경했습니다.')
    }catch(e){setError(e instanceof Error?e.message:'변경을 저장하지 못했습니다.')}
    finally{setBusy(false)}
  }
  return <main className="cms-shell">
    <header className="cms-head">
      <div><span className="cms-eyebrow">JJinMangGo · Frontend Lab</span><h1>강의 자료 관리</h1>
        <p>Cloudflare Workers Free + D1 · 강의·퀴즈·CSS·JavaScript</p></div>
      <div className="cms-account"><span>{email||'관리자 인증 확인 중'}</span><a href="/">학생 화면</a></div>
    </header>
    {error && <p className="cms-error" role="alert">{error}</p>}
    {notice && <p className="cms-notice" role="status">{notice}</p>}
    <div className="cms-grid">
      <aside className="cms-side">
        <div className="cms-side-head"><strong>강의·파일 목록</strong><span>{files.length}개</span></div>
        <label htmlFor="cms-search" className="cms-visually-hidden">파일 검색</label>
        <input id="cms-search" placeholder="강의 이름 또는 경로 검색" value={search} onChange={event=>setSearch(event.target.value)}/>
        <div className="cms-file-list">
          {visible.map(item=>{
            const current=edited.find(entry=>entry.path===item.path)
            return <button className={'cms-file '+(selected===item.path?'selected':'')} type="button"
              key={item.path} onClick={()=>{setSelected(item.path);setNotice('')}}>
              <span className="cms-file-name">{item.title}</span>
              <span className="cms-file-path">{item.path}</span>
              {current?.hidden?<em>숨김</em>:current?.has_published?<em>수정 게시</em>:null}
            </button>
          })}
        </div>
        <details className="cms-roster"><summary>학생 이름 등록 목록 ({roster.length}명)</summary>
          <p>Google 계정과 별도로 등록한 이름입니다. 교사에게만 공개됩니다.</p>
          <ul>{roster.map(student=><li key={student.email}>
            <strong>{student.student_name}</strong><small>{student.email}</small>
          </li>)}</ul>
        </details>
      </aside>
      <section className="cms-editor">
        {!page?<p className="cms-placeholder">{ready?'좌측 강의를 선택하세요.':'관리자 화면을 불러오는 중입니다…'}</p>:
          <>
            <div className="cms-editor-title">
              <div><span className="cms-eyebrow">{page.kind.toUpperCase()} 파일</span>
                <h2>{selected==='/'?'메인 홈페이지':selected}</h2>
                <p>{page.published?'CMS 게시 중':page.originalExists?'원본 GitHub 자료 사용 중':'신규 자료'} · {page.hidden?'학생 화면에서 숨김':'학생에게 공개'}{unsaved?' · 저장하지 않은 변경 있음':''}</p>
              </div>
              <div className="cms-editor-actions">
                <button type="button" disabled={busy||!source.trim()} onClick={()=>void action('saveDraft')}>초안 저장</button>
                <button className="cms-primary" type="button" disabled={busy||!source.trim()} onClick={()=>void action('publish')}>게시</button>
                <button className="cms-danger" type="button" disabled={busy} onClick={()=>void action(page.hidden?'show':'hide')}>{page.hidden?'다시 공개':'숨기기'}</button>
              </div>
            </div>
            <label htmlFor="cms-source">콘텐츠 소스 · {source.length.toLocaleString()}자</label>
            <textarea id="cms-source" spellCheck={false} value={source} onChange={event=>setSource(event.target.value)}
              aria-describedby="cms-note" className="cms-textarea"/>
            <p id="cms-note" className="cms-help">기존 HTML·CSS·JS 구조를 보존합니다. 초안 저장 후 게시해야 학생 화면에 반영됩니다. 게시 전 수업 기능을 직접 확인해 주세요.</p>
            {page.kind==='html' && <details className="cms-preview">
              <summary>HTML 미리보기 (스크립트 비활성화)</summary>
              <iframe title="편집 내용 HTML 미리보기" sandbox="" srcDoc={source}/>
            </details>}
            <section className="cms-history">
              <div className="cms-history-head"><h3>게시·변경 이력</h3><span>최신 50개</span></div>
              {history.length===0?<p>아직 CMS 이력이 없습니다. 원본 파일은 그대로 보존돼 있습니다.</p>:
                <ul>{history.map(version=><li key={version.id}>
                  <div><strong>#{version.id} · {version.action}</strong>
                    <small>{version.created_at} · {version.actor_email}</small></div>
                  <button type="button" disabled={busy} onClick={()=>void action('restore',version.id)}>이 버전 복원</button>
                </li>)}</ul>}
            </section>
            <div className="cms-footer-actions">
              {selected!=='/'?<a href={selected} target="_blank" rel="noopener noreferrer">학생 강의 화면 확인</a>:
                <a href="/" target="_blank" rel="noopener noreferrer">메인 화면 확인</a>}
              <button type="button" onClick={()=>{void load(selected)}} disabled={busy}>마지막 저장본 다시 불러오기</button>
            </div>
          </>
        }
      </section>
    </div>
  </main>
}
