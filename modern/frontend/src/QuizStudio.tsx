import {useEffect,useState} from 'react'
import {learningJson} from './MyPage'
import './learning.css'
type Kind='single'|'short'
interface Question{
  id:string;kind:Kind;prompt:string;category:string;options:string[];answer:number|string;explanation:string
}
interface ListItem{slug:string;title:string;description:string;published_version:number;is_published:number;updated_at:string}
interface QuizDetail{
  slug:string;title:string;description:string;questions:Question[];
  published:boolean;version:number;updatedAt:string
}
interface Version{version:number;saved_at:string;edited_by:string}
interface Imported{slug:string;title:string;description:string;questions:Question[]}
const blank=(kind:Kind='single'):Question=>({
  id:'q'+crypto.randomUUID().replaceAll('-','').slice(0,12),kind,prompt:'',
  category:'',options:kind==='single'?['','']:[],answer:kind==='single'?0:'',explanation:''
})
const read=(slug:string)=>learningJson<{quiz:QuizDetail;versions:Version[]}>('/api/admin/quiz?slug='+encodeURIComponent(slug))
const post=(data:Record<string,unknown>)=>learningJson<{ok:boolean;result?:unknown}>('/api/admin/quiz',{
  method:'POST',headers:{'Content-Type':'application/json','X-Frontend-Lab':'quiz-author'},
  body:JSON.stringify(data)
})
function copyQuestion(q:Question):Question{return {...q,options:[...q.options]}}
export default function QuizStudio(){
  const [list,setList]=useState<ListItem[]>([])
  const [legacy,setLegacy]=useState<Array<{path:string;title:string;count:number}>>([])
  const [slug,setSlug]=useState('')
  const [title,setTitle]=useState('')
  const [description,setDescription]=useState('')
  const [questions,setQuestions]=useState<Question[]>([blank()])
  const [versions,setVersions]=useState<Version[]>([])
  const [published,setPublished]=useState(false)
  const [version,setVersion]=useState(0)
  const [newMode,setNewMode]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  async function loadLists(){
    const [managed,original]=await Promise.all([
      learningJson<{quizzes:ListItem[]}>('/api/admin/quizzes'),
      learningJson<{items:Array<{path:string;title:string;count:number}>}>('/api/admin/quiz/legacy'),
    ])
    setList(managed.quizzes);setLegacy(original.items)
  }
  useEffect(()=>{void loadLists().catch(e=>setError(e instanceof Error?e.message:'문제 목록 조회 실패'))},[])
  async function open(slug:string){
    setBusy(true);setError('');setNotice('')
    try{
      const response=await read(slug)
      setSlug(response.quiz.slug);setTitle(response.quiz.title)
      setDescription(response.quiz.description);setQuestions(response.quiz.questions.map(copyQuestion))
      setVersions(response.versions);setPublished(response.quiz.published)
      setVersion(response.quiz.version);setNewMode(false)
    }catch(e){setError(e instanceof Error?e.message:'문제를 불러오지 못했습니다.')}
    finally{setBusy(false)}
  }
  async function importLegacy(path:string){
    if(!path)return
    setBusy(true);setError('');setNotice('')
    try{
      const quiz=await learningJson<Imported>('/api/admin/quiz/import?path='+encodeURIComponent(path))
      setSlug(quiz.slug);setTitle(quiz.title);setDescription(quiz.description)
      setQuestions(quiz.questions);setVersions([]);setVersion(0);setPublished(false);setNewMode(true)
      setNotice('기존 문제를 새 관리형 퀴즈로 복사했습니다. 원본은 변경되지 않으며, 저장·게시하면 새 문제 주소가 생성됩니다.')
    }catch(e){setError(e instanceof Error?e.message:'기존 문제를 가져오지 못했습니다.')}
    finally{setBusy(false)}
  }
  function resetNew(){
    setSlug('');setTitle('');setDescription('');setQuestions([blank()]);setNewMode(true);
    setPublished(false);setVersion(0);setVersions([]);setNotice('');setError('')
  }
  function editQuestion(i:number,patch:Partial<Question>){
    setQuestions(prev=>prev.map((q,index)=>index===i?{...q,...patch}:q))
  }
  function editOption(i:number,opt:number,value:string){
    setQuestions(prev=>prev.map((q,index)=>index!==i?q:{...q,
      options:q.options.map((o,j)=>j===opt?value:o)}))
  }
  function addOption(i:number){
    setQuestions(prev=>prev.map((q,index)=>index===i&&q.options.length<6?{...q,options:[...q.options,'']}:q))
  }
  function removeOption(i:number,opt:number){
    setQuestions(prev=>prev.map((q,index)=>{
      if(index!==i||q.options.length<=2)return q
      const options=q.options.filter((_,j)=>j!==opt)
      const answer=typeof q.answer==='number'?(q.answer===opt?0:q.answer>opt?q.answer-1:q.answer):0
      return {...q,options,answer}
    }))
  }
  async function action(type:'save'|'publish'|'unpublish'|'restore',historyVersion?:number){
    if(busy)return
    if(type==='unpublish'&&!window.confirm('학생 화면에서 이 관리형 퀴즈를 숨길까요?'))return
    if(type==='restore'&&!window.confirm('이전 게시본을 현재 초안으로 가져올까요? 현재 게시본은 그대로 유지됩니다.'))return
    setBusy(true);setError('');setNotice('')
    try{
      if(type==='save')await post({action:'save',slug,title,description,questions})
      if(type==='publish') {
        // Save the latest form state before publishing, so teacher never loses edits.
        await post({action:'save',slug,title,description,questions})
        await post({action:'publish',slug})
      }
      if(type==='unpublish')await post({action:'unpublish',slug})
      if(type==='restore')await post({action:'restore',slug,version:historyVersion})
      await loadLists()
      await open(slug)
      setNotice(type==='save'?'초안을 저장했어요. 게시를 눌러야 학생에게 공개돼요.':
        type==='publish'?'새 문제를 게시했어요. 학생 마이페이지에서 접근할 수 있어요.':
        type==='unpublish'?'문제 공개를 중단했습니다.':'이전 버전을 초안으로 복구했습니다.')
    }catch(e){setError(e instanceof Error?e.message:'작업을 저장하지 못했습니다.')}
    finally{setBusy(false)}
  }
  return <div className="lab-studio">
    <div className="lab-section-heading"><div><span className="lab-eyebrow">QUESTION STUDIO</span>
      <h2>문제 관리</h2><p>문항을 직접 추가·수정하고, 정답·해설을 지정해 게시합니다.</p></div>
      <button className="lab-button lab-button-primary" type="button" onClick={resetNew}>새 퀴즈 만들기</button></div>
    <div className="lab-studio-grid">
      <aside className="lab-panel lab-studio-side">
        <div className="lab-panel-header"><h3>관리형 퀴즈</h3><small>{list.length}개</small></div>
        <div className="lab-managed-list">{list.map(q=><button key={q.slug} type="button"
          className={'lab-managed-row '+(slug===q.slug&&!newMode?'active':'')}
          onClick={()=>void open(q.slug)}><strong>{q.title}</strong>
          <small>{q.slug} · {q.is_published?'게시됨':'초안'}</small></button>)}</div>
        {!list.length&&<p className="lab-empty">등록된 문제가 없습니다.</p>}
        <div className="lab-panel-header lab-import-head"><h3>기존 퀴즈 가져오기</h3></div>
        <label htmlFor="lab-legacy-picker" className="lab-meta-label">원본 문제를 복사해 새 문제로 편집</label>
        <select id="lab-legacy-picker" defaultValue="" onChange={e=>{void importLegacy(e.target.value);e.currentTarget.value=''}}>
          <option value="">가져올 퀴즈 선택</option>
          {legacy.map(q=><option key={q.path} value={q.path}>{q.title} · {q.count}문항</option>)}
        </select>
        <p className="lab-fineprint">원래 강의 파일은 유지되고, 새 관리형 문제로 복사됩니다.</p>
      </aside>
      <section className="lab-panel lab-studio-editor">
        <div className="lab-panel-header"><h3>{newMode?'새 문제 구성':'문제 편집'}</h3>
          <span className="lab-muted">{published?'게시 버전 '+version:'미게시'}</span></div>
        {error&&<p className="lab-alert" role="alert">{error}</p>}
        {notice&&<p className="lab-notice" role="status">{notice}</p>}
        <div className="lab-form-grid">
          <label>퀴즈 고유 주소 ID
            <input className="lab-input" value={slug} disabled={!newMode}
              onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}
              placeholder="html-basic" maxLength={60}/>
            <small>영문 소문자, 숫자, 하이픈 · 게시 후 변경하지 않음</small>
          </label>
          <label>퀴즈 제목
            <input className="lab-input" value={title} maxLength={120} onChange={e=>setTitle(e.target.value)}
              placeholder="HTML 기초 확인 문제"/></label>
        </div>
        <label className="lab-block-label">퀴즈 설명
          <textarea className="lab-input lab-description" value={description} maxLength={800}
            onChange={e=>setDescription(e.target.value)} placeholder="문제를 소개하는 한두 문장"/></label>
        <div className="lab-question-head"><h3>문항 편집 <span className="lab-muted">{questions.length}개</span></h3>
          <button type="button" className="lab-button" disabled={questions.length>=50} onClick={()=>setQuestions(q=>[...q,blank()])}>문항 추가</button></div>
        {questions.map((q,i)=><article key={q.id} className="lab-question-editor">
          <div className="lab-question-editor-head">
            <strong>문제 {i+1}</strong><div className="lab-row-actions">
              <button type="button" className="lab-text-button" disabled={i===0} onClick={()=>
                setQuestions(xs=>{const ys=[...xs];[ys[i-1],ys[i]]=[ys[i],ys[i-1]];return ys})}>위로</button>
              <button type="button" className="lab-text-button" disabled={i===questions.length-1} onClick={()=>
                setQuestions(xs=>{const ys=[...xs];[ys[i+1],ys[i]]=[ys[i],ys[i+1]];return ys})}>아래로</button>
              <button type="button" className="lab-text-button lab-text-danger" disabled={questions.length<=1}
                onClick={()=>setQuestions(xs=>xs.filter((_,j)=>j!==i))}>삭제</button>
            </div>
          </div>
          <div className="lab-form-grid">
            <label>유형
              <select value={q.kind} onChange={e=>{
                const kind=e.target.value as Kind
                editQuestion(i,{kind,options:kind==='single'?['','']:[],answer:kind==='single'?0:''})
              }}><option value="single">객관식</option><option value="short">단답형</option></select></label>
            <label>분류
              <input className="lab-input" value={q.category} maxLength={100}
                onChange={e=>editQuestion(i,{category:e.target.value})} placeholder="개념 확인"/></label>
          </div>
          <label className="lab-block-label">문제 내용
            <textarea className="lab-input" value={q.prompt} maxLength={1500}
              onChange={e=>editQuestion(i,{prompt:e.target.value})} placeholder="질문을 입력해 주세요."/></label>
          {q.kind==='single'?<fieldset className="lab-option-editor">
            <legend>보기 및 정답 선택</legend>
            {q.options.map((option,j)=><div key={j} className="lab-option-row">
              <input type="radio" name={'correct-'+q.id} checked={q.answer===j}
                onChange={()=>editQuestion(i,{answer:j})} aria-label={(j+1)+'번 정답 지정'}/>
              <input className="lab-input" value={option} maxLength={600} onChange={e=>editOption(i,j,e.target.value)}
                placeholder={'보기 '+(j+1)}/>
              <button type="button" className="lab-text-button" disabled={q.options.length<=2}
                onClick={()=>removeOption(i,j)}>제거</button>
            </div>)}
            <button type="button" className="lab-text-button" disabled={q.options.length>=6}
              onClick={()=>addOption(i)}>+ 보기 추가</button>
          </fieldset>:<label className="lab-block-label">정답 문자열
            <input className="lab-input" value={typeof q.answer==='string'?q.answer:''}
              onChange={e=>editQuestion(i,{answer:e.target.value})} placeholder="정답을 입력해 주세요." maxLength={300}/></label>}
          <label className="lab-block-label">해설
            <textarea className="lab-input" value={q.explanation} maxLength={2500}
              onChange={e=>editQuestion(i,{explanation:e.target.value})} placeholder="정답 설명 (선택)"/></label>
        </article>)}
        <div className="lab-row-actions lab-actionbar">
          <button type="button" disabled={busy} className="lab-button" onClick={()=>void action('save')}>{busy?'처리 중…':'초안 저장'}</button>
          <button type="button" disabled={busy} className="lab-button lab-button-primary" onClick={()=>void action('publish')}>학생에게 게시</button>
          {published&&<button type="button" disabled={busy} className="lab-button" onClick={()=>void action('unpublish')}>공개 중단</button>}
          {published&&<a className="lab-button" target="_blank" rel="noopener noreferrer" href={'/practice/'+slug}>학생 화면 확인</a>}
        </div>
        {versions.length>0&&<section className="lab-version-history"><h3>게시 버전 기록</h3>
          {versions.map(v=><div key={v.version} className="lab-version-row">
            <span>버전 {v.version} · {v.saved_at} · {v.edited_by}</span>
            <button type="button" className="lab-text-button" disabled={busy} onClick={()=>void action('restore',v.version)}>초안으로 복원</button>
          </div>)}
        </section>}
      </section>
    </div>
  </div>
}
