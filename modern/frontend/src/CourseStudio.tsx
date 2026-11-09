import {useEffect,useMemo,useRef,useState,type FormEvent} from 'react'
import {learningJson} from './MyPage'
import './native.css'

interface LessonIndex{
  slug:string;title:string;category:string;summary:string;published:number;
  revision:number;updated_at:string;source_path:string
}
interface Lesson extends LessonIndex{
  draft_html:string;published_html:string|null;sort_order:number;updated_by:string|null
}
interface History{id:number;revision:number;action:string;edited_by:string;created_at:string}
type Detail={lesson:Lesson;history:History[]}
function action(slug:string,cmd:string,extra:Record<string,unknown>={}){
  return learningJson<Record<string,unknown>>('/api/admin/native/lesson',{
    method:'POST',headers:{'Content-Type':'application/json','X-Frontend-Lab':'course-write'},
    body:JSON.stringify({slug,action:cmd,...extra}),
  })
}
export default function CourseStudio(){
  const [list,setList]=useState<LessonIndex[]>([])
  const [active,setActive]=useState<Lesson|null>(null)
  const [history,setHistory]=useState<History[]>([])
  const [search,setSearch]=useState('')
  const [title,setTitle]=useState('')
  const [category,setCategory]=useState('')
  const [summary,setSummary]=useState('')
  const [html,setHtml]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [createMode,setCreateMode]=useState(false)
  const [newSlug,setNewSlug]=useState('')
  const [newTitle,setNewTitle]=useState('')
  const editor=useRef<HTMLDivElement|null>(null)
  const selected=useRef<string>('')
  const filtered=useMemo(()=>list.filter(item=>(item.title+' '+item.category).toLowerCase().includes(search.toLowerCase().trim())),[list,search])
  async function reloadList(){
    const data=await learningJson<{lessons:LessonIndex[]}>('/api/admin/native/lessons')
    setList(data.lessons)
    return data.lessons
  }
  async function load(slug:string) {
    setError('');setNotice('')
    const response=await learningJson<Detail>('/api/admin/native/lesson?slug='+encodeURIComponent(slug))
    selected.current=slug
    setActive(response.lesson);setHistory(response.history)
    setTitle(response.lesson.title);setCategory(response.lesson.category)
    setSummary(response.lesson.summary);setHtml(response.lesson.draft_html)
    setCreateMode(false)
    if(editor.current)editor.current.innerHTML=response.lesson.draft_html
  }
  useEffect(()=>{
    let cancelled=false
    void learningJson<{lessons:LessonIndex[]}>('/api/admin/native/lessons')
      .then(info=>{if(!cancelled){setList(info.lessons);if(info.lessons[0])void load(info.lessons[0].slug)}})
      .catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'강의를 불러오지 못했습니다.')})
    return()=>{cancelled=true}
  },[])
  useEffect(()=>{
    if(active && editor.current && selected.current===active.slug){
      // Set the DOM only when switching content; do not overwrite typing on every render.
      editor.current.innerHTML=active.draft_html
    }
  },[active?.slug])
  const dirty=!!active&&(title!==active.title||category!==active.category||
    summary!==active.summary||html!==active.draft_html)
  async function create(event:FormEvent){
    event.preventDefault();setBusy(true);setError('');setNotice('')
    try{
      const slug=newSlug.trim()
      await action(slug,'create',{title:newTitle.trim()})
      await reloadList();await load(slug)
      setNewSlug('');setNewTitle('')
      setNotice('새 강의가 생성됐습니다. 내용을 입력하고 게시해 주세요.')
    }catch(e){setError(e instanceof Error?e.message:'강의를 생성하지 못했습니다.')}
    finally{setBusy(false)}
  }
  async function save(publish=false){
    if(!active||busy)return
    setBusy(true);setError('');setNotice('')
    try{
      await action(active.slug,'save',{title,category,summary,html,
        baseRevision:active.revision})
      if(publish)await action(active.slug,'publish',{baseRevision:active.revision})
      await reloadList();await load(active.slug)
      setNotice(publish?'강의를 게시했습니다. 학습 화면에 바로 반영됩니다.':'강의 초안을 저장했습니다.')
    }catch(e){setError(e instanceof Error?e.message:'강의를 저장하지 못했습니다.')}
    finally{setBusy(false)}
  }
  async function visibility(){
    if(!active||busy)return
    if(!window.confirm(active.published?'이 강의를 학생 화면에서 숨길까요?':'다시 공개할까요?'))return
    setBusy(true);setError('');setNotice('')
    try{
      await action(active.slug,active.published?'hide':'show',{baseRevision:active.revision})
      await reloadList();await load(active.slug)
    }catch(e){setError(e instanceof Error?e.message:'상태를 변경하지 못했습니다.')}
    finally{setBusy(false)}
  }
  async function restore(versionId:number){
    if(!active||busy||!window.confirm('이전 내용을 편집 초안으로 가져올까요?'))return
    setBusy(true);setError('');setNotice('')
    try{
      await action(active.slug,'restore',{versionId,baseRevision:active.revision})
      await load(active.slug)
      setNotice('이전 내용을 초안으로 불러왔습니다. 확인 후 게시해 주세요.')
    }catch(e){setError(e instanceof Error?e.message:'이력을 복원하지 못했습니다.')}
    finally{setBusy(false)}
  }
  function command(cmd:string,value?:string) {
    if(!editor.current)return
    editor.current.focus()
    document.execCommand(cmd,false,value)
    setHtml(editor.current.innerHTML)
  }
  function insertLink(){
    const address=window.prompt('연결할 링크 주소를 입력해 주세요.','https://')
    if(!address)return
    if(!/^(?:https?:\/\/|\/|#)/i.test(address)){setError('http(s), 사이트 상대경로 또는 #으로 시작하는 주소만 허용합니다.');return}
    command('createLink',address)
  }
  return <section className="native-cms">
    <div className="lab-section-heading"><div><span className="lab-eyebrow">CONTENT STUDIO</span>
      <h2>강의 관리</h2><p>강의 본문을 직접 편집하고, 저장·게시·이전 버전 복원을 관리합니다.</p></div>
      <button type="button" className="lab-button lab-button-primary" onClick={()=>{setCreateMode(x=>!x);setError('')}}>새 강의</button>
    </div>
    {error&&<p role="alert" className="lab-alert">{error}</p>}
    {notice&&<p role="status" className="lab-notice">{notice}</p>}
    {createMode&&<form className="lab-panel native-create-form" onSubmit={e=>void create(e)}>
      <div className="lab-panel-header"><h3>새 강의 생성</h3>
        <button className="lab-text-button" type="button" onClick={()=>setCreateMode(false)}>닫기</button></div>
      <div className="lab-form-grid">
        <label>강의 주소 (영문)
          <input className="lab-input" required placeholder="my-first-lesson" value={newSlug}
            maxLength={100} onChange={e=>setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}/></label>
        <label>강의 제목
          <input className="lab-input" required value={newTitle} maxLength={180}
            onChange={e=>setNewTitle(e.target.value)}/></label>
      </div>
      <button className="lab-button lab-button-primary" disabled={busy}>강의 생성</button>
    </form>}
    <div className="native-studio-grid">
      <aside className="lab-panel native-lesson-list">
        <div className="lab-panel-header"><h3>강의 목록</h3><small>{list.length}개</small></div>
        <label className="native-sr-only" htmlFor="course-studio-search">강의 검색</label>
        <input id="course-studio-search" className="lab-input" placeholder="강의명 또는 분류 검색"
          value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="native-list-entries">
          {filtered.map(item=><button key={item.slug} type="button"
            className={'native-entry '+(active?.slug===item.slug?'selected':'')}
            onClick={()=>{if(dirty&&!window.confirm('저장하지 않은 변경을 버릴까요?'))return;void load(item.slug)}}>
            <span className="native-overline">{item.category} · {item.published?'공개':'비공개'}</span>
            <strong>{item.title}</strong>
            <small>강의 콘텐츠</small>
          </button>)}
        </div>
        {!filtered.length&&<p className="native-muted">검색 결과가 없습니다.</p>}
      </aside>
      <div className="lab-panel native-course-editor">
        {!active?<p className="native-muted">편집할 강의를 선택해 주세요.</p>:<>
          <div className="lab-panel-header"><div>
            <span className="lab-eyebrow">{active.category} · {active.published?'공개 강의':'비공개 강의'}</span>
            <h3>{active.title}</h3>
            <small>마지막 수정 {active.updated_at} · 버전 {active.revision}</small></div>
          </div>
          <div className="lab-form-grid">
            <label>강의 제목<input className="lab-input" value={title} maxLength={180} onChange={e=>setTitle(e.target.value)}/></label>
            <label>분류<input className="lab-input" value={category} maxLength={80} onChange={e=>setCategory(e.target.value)}/></label>
          </div>
          <label className="native-field">강의 소개
            <textarea className="lab-input" value={summary} maxLength={900} rows={2}
              onChange={e=>setSummary(e.target.value)}/></label>
          <div className="native-editor-heading"><h3>본문 편집</h3><span>{dirty?'저장하지 않은 변경':'저장된 내용'}</span></div>
          <div className="native-editor-toolbar" role="toolbar" aria-label="글쓰기 서식">
            <button type="button" onClick={()=>command('formatBlock','p')}>본문</button>
            <button type="button" onClick={()=>command('formatBlock','h2')}>제목</button>
            <button type="button" onClick={()=>command('formatBlock','h3')}>소제목</button>
            <button type="button" onClick={()=>command('bold')}><strong>굵게</strong></button>
            <button type="button" onClick={()=>command('italic')}><em>기울임</em></button>
            <button type="button" onClick={()=>command('insertUnorderedList')}>글머리</button>
            <button type="button" onClick={()=>command('insertOrderedList')}>번호</button>
            <button type="button" onClick={insertLink}>링크</button>
            <button type="button" onClick={()=>command('insertHorizontalRule')}>구분선</button>
          </div>
          <div className="native-rich-editor" ref={editor} contentEditable suppressContentEditableWarning
            role="textbox" aria-label="강의 본문" aria-multiline="true" spellCheck
            onInput={()=>setHtml(editor.current?.innerHTML??'')}/>
          <div className="lab-row-actions native-savebar">
            <button className="lab-button" type="button" disabled={busy} onClick={()=>void save(false)}>초안 저장</button>
            <button className="lab-button lab-button-primary" type="button" disabled={busy} onClick={()=>void save(true)}>강의 게시</button>
            <button className="lab-button" type="button" disabled={busy} onClick={()=>void visibility()}>{active.published?'공개 중단':'공개 재개'}</button>
            <a className="lab-button" href={'/learn/'+active.slug} target="_blank" rel="noreferrer">학생 화면 보기</a>
          </div>
          <div className="native-history">
            <h3>버전 기록 <span>{history.length}개</span></h3>
            {history.map(entry=><div className="native-history-row" key={entry.id}>
              <div><strong>버전 {entry.revision} · {entry.action}</strong><small>{entry.created_at} · {entry.edited_by}</small></div>
              <button className="lab-text-button" type="button" disabled={busy} onClick={()=>void restore(entry.id)}>초안으로 복원</button>
            </div>)}
            {!history.length&&<p className="native-muted">아직 게시 이력이 없습니다.</p>}
          </div>
        </>}
      </div>
    </div>
  </section>
}
