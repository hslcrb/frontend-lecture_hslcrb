import {useEffect,useMemo,useState} from 'react'
import {learningJson} from './MyPage'
import './native.css'

type Kind='single'|'short'
interface Question{
  id:string;kind:Kind;prompt:string;category:string;options:string[];
  answer:number|string;explanation:string;hint?:string;code?:string;tree?:string;preview?:string
}
interface QuizRow{
  slug:string;title:string;description:string;published_version:number;
  is_published:number;updated_at:string;question_count:number
}
interface QuizDetail{
  slug:string;title:string;description:string;questions:Question[];
  published:boolean;version:number;updatedAt:string
}
interface Version{version:number;saved_at:string;edited_by:string}
const newQuestion=(kind:Kind='single'):Question=>({
  id:'q'+crypto.randomUUID().replaceAll('-','').slice(0,16),
  kind,prompt:'',category:'',options:kind==='single'?['','']:[],
  answer:kind==='single'?0:'',explanation:''
})
async function post(payload:Record<string,unknown>){
  return learningJson<{ok:boolean}>('/api/admin/quiz',{
    method:'POST',headers:{'Content-Type':'application/json','X-Frontend-Lab':'quiz-author'},
    body:JSON.stringify(payload)
  })
}
export default function QuestionBank(){
  const [list,setList]=useState<QuizRow[]>([])
  const [slug,setSlug]=useState('')
  const [title,setTitle]=useState('')
  const [description,setDescription]=useState('')
  const [questions,setQuestions]=useState<Question[]>([])
  const [index,setIndex]=useState(0)
  const [history,setHistory]=useState<Version[]>([])
  const [version,setVersion]=useState(0)
  const [published,setPublished]=useState(false)
  const [creating,setCreating]=useState(false)
  const [search,setSearch]=useState('')
  const [questionSearch,setQuestionSearch]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const filtered=useMemo(()=>list.filter(q=>
    (q.title+' '+q.description).toLowerCase().includes(search.toLowerCase().trim())),[list,search])
  const filteredQuestions=useMemo(()=>questions.map((q,i)=>({...q,index:i})).filter(q=>
    (q.prompt+' '+q.category).toLowerCase().includes(questionSearch.toLowerCase().trim())),[questions,questionSearch])
  const current=questions[index]
  async function refresh(){
    const result=await learningJson<{quizzes:QuizRow[]}>('/api/admin/quizzes')
    setList(result.quizzes)
    return result.quizzes
  }
  async function open(target:string){
    setError('');setNotice('');setBusy(true)
    try{
      const response=await learningJson<{quiz:QuizDetail;versions:Version[]}>(
        '/api/admin/quiz?slug='+encodeURIComponent(target))
      const quiz=response.quiz
      setSlug(quiz.slug);setTitle(quiz.title);setDescription(quiz.description)
      setQuestions(quiz.questions.map(q=>({...q,options:[...q.options]})))
      setVersion(quiz.version);setPublished(quiz.published)
      setHistory(response.versions);setIndex(0);setCreating(false);setQuestionSearch('')
    }catch(e){setError(e instanceof Error?e.message:'문제를 불러오지 못했습니다.')}
    finally{setBusy(false)}
  }
  useEffect(()=>{
    let cancelled=false
    void learningJson<{quizzes:QuizRow[]}>('/api/admin/quizzes').then(result=>{
      if(cancelled)return
      setList(result.quizzes)
      if(result.quizzes[0])void open(result.quizzes[0].slug)
    }).catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'문제은행을 불러오지 못했습니다.')})
    return()=>{cancelled=true}
  },[])
  function begin(){
    setSlug('');setTitle('');setDescription('');setQuestions([newQuestion()])
    setIndex(0);setHistory([]);setVersion(0);setPublished(false);setCreating(true)
    setNotice('');setError('');setQuestionSearch('')
  }
  function edit(fields:Partial<Question>){
    setQuestions(old=>old.map((q,i)=>i===index?{...q,...fields}:q))
  }
  function editOption(optionIndex:number,value:string){
    setQuestions(old=>old.map((q,i)=>i===index?{
      ...q,options:q.options.map((o,j)=>j===optionIndex?value:o)
    }:q))
  }
  function addQuestion(){
    if(questions.length>=50)return
    setQuestions(old=>[...old,newQuestion()])
    setIndex(questions.length);setQuestionSearch('')
  }
  function removeQuestion(){
    if(questions.length<=1)return
    if(!window.confirm('선택한 문항을 목록에서 삭제할까요? 게시 전까지 학생에게는 반영되지 않습니다.'))return
    setQuestions(old=>old.filter((_,i)=>i!==index))
    setIndex(Math.max(0,index-1))
  }
  function duplicate(){
    if(!current||questions.length>=50)return
    const copy={...current,id:'q'+crypto.randomUUID().replaceAll('-','').slice(0,16),
      options:[...current.options]}
    setQuestions(old=>[...old.slice(0,index+1),copy,...old.slice(index+1)])
    setIndex(index+1)
  }
  function move(direction:-1|1){
    const dest=index+direction
    if(dest<0||dest>=questions.length)return
    setQuestions(old=>{const a=[...old];[a[index],a[dest]]=[a[dest],a[index]];return a})
    setIndex(dest)
  }
  async function save(mode:'save'|'publish'|'unpublish'|'restore',restoreVersion?:number){
    if(busy)return
    if(mode==='unpublish'&&!window.confirm('이 문제 세트를 비공개로 전환할까요?'))return
    if(mode==='restore'&&!window.confirm('선택한 버전을 편집 초안으로 가져올까요?'))return
    setBusy(true);setError('');setNotice('')
    try {
      if(mode==='save'||mode==='publish'){
        await post({action:'save',slug,title,description,questions})
        if(mode==='publish')await post({action:'publish',slug})
      }
      if(mode==='unpublish')await post({action:'unpublish',slug})
      if(mode==='restore')await post({action:'restore',slug,version:restoreVersion})
      await refresh()
      await open(slug)
      setNotice(mode==='save'?'초안이 저장됐습니다. 게시를 눌러 공개하세요.':
        mode==='publish'?'문항을 게시했습니다. 학생 학습 화면에 반영됩니다.':
        mode==='unpublish'?'문제 공개를 중단했습니다.':'이전 버전을 초안으로 복구했습니다.')
    }catch(e){setError(e instanceof Error?e.message:'저장에 실패했습니다.')}
    finally{setBusy(false)}
  }
  return <section className="native-cms">
    <div className="lab-section-heading"><div>
      <span className="lab-eyebrow">QUESTION BANK</span>
      <h2>문제은행</h2>
      <p>문제 세트와 개별 문항을 선택해 수정하고, 검토한 내용을 게시합니다.</p>
    </div><button className="lab-button lab-button-primary" type="button" onClick={begin}>새 문제 세트</button></div>
    {error&&<p className="lab-alert" role="alert">{error}</p>}
    {notice&&<p className="lab-notice" role="status">{notice}</p>}
    <div className="native-bank-grid">
      <aside className="lab-panel native-bank-sets">
        <div className="lab-panel-header"><h3>문제 세트</h3><small>{list.length}개</small></div>
        <label className="native-sr-only" htmlFor="bank-search">문제 세트 검색</label>
        <input className="lab-input" id="bank-search" placeholder="과목·퀴즈명 검색"
          value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="native-list-entries">
          {filtered.map(set=><button key={set.slug} type="button"
            className={'native-entry '+(slug===set.slug&&!creating?'selected':'')}
            onClick={()=>void open(set.slug)}>
            <span className="native-overline">{set.is_published?'게시됨':'비공개'} · {set.question_count??0}문항</span>
            <strong>{set.title}</strong>
            <small>{set.description||'문제 세트'}</small>
          </button>)}
        </div>
      </aside>
      <div className="lab-panel native-bank-main">
        {!slug&&!creating?<p className="native-muted">문제 세트를 선택하거나 새로 만들어 주세요.</p>:<>
          <div className="lab-panel-header"><div>
            <span className="native-overline">{published?'공개 중':'비공개'} · {questions.length}문항 · 버전 {version}</span>
            <h3>{creating?'새 문제 세트':title||'제목 없는 퀴즈'}</h3>
          </div></div>
          <div className="lab-form-grid">
            {creating&&<label>퀴즈 주소 (영문)
              <input className="lab-input" maxLength={60} value={slug} placeholder="html-basic"
                onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}/></label>}
            <label>문제 세트 제목
              <input className="lab-input" maxLength={120} value={title}
                onChange={e=>setTitle(e.target.value)} placeholder="예: CSS 기초 확인"/></label>
          </div>
          <label className="native-field">설명
            <textarea className="lab-input" rows={2} maxLength={800} value={description}
              onChange={e=>setDescription(e.target.value)}/></label>
          <div className="lab-panel-header native-question-list-heading">
            <div><h3>전체 문항</h3><small>문항을 선택하면 아래에서 바로 편집할 수 있습니다.</small></div>
            <button className="lab-button" type="button" disabled={questions.length>=50} onClick={addQuestion}>문항 추가</button>
          </div>
          <label htmlFor="question-search" className="native-sr-only">문항 검색</label>
          <input id="question-search" className="lab-input" placeholder="문항 내용·분류 검색"
            value={questionSearch} onChange={e=>setQuestionSearch(e.target.value)}/>
          <div className="native-question-index" role="list" aria-label="등록된 문항">
            {filteredQuestions.map(q=><button type="button" role="listitem" key={q.id}
              className={'native-question-row '+(index===q.index?'selected':'')}
              onClick={()=>setIndex(q.index)}>
              <span className="native-q-number">{String(q.index+1).padStart(2,'0')}</span>
              <span className="native-q-title">{q.prompt||'문제 내용을 입력해 주세요.'}
                <small>{q.category||'일반'} · {q.kind==='single'?'객관식':'단답형'}</small></span>
              <span className="native-q-state">{index===q.index?'편집 중':'편집'}</span>
            </button>)}
          </div>
          {!filteredQuestions.length&&<p className="native-muted">검색 결과가 없습니다.</p>}
          {current&&<article className="native-question-form" aria-label="선택한 문항 편집">
            <div className="lab-panel-header"><div><span className="native-overline">QUESTION {index+1}</span>
              <h3>문항 편집</h3></div>
              <div className="lab-row-actions">
                <button className="lab-text-button" type="button" onClick={()=>move(-1)} disabled={index===0}>위로</button>
                <button className="lab-text-button" type="button" onClick={()=>move(1)} disabled={index===questions.length-1}>아래로</button>
                <button className="lab-text-button" type="button" onClick={duplicate} disabled={questions.length>=50}>복제</button>
                <button className="lab-text-button lab-text-danger" type="button" onClick={removeQuestion} disabled={questions.length<=1}>삭제</button>
              </div>
            </div>
            <div className="lab-form-grid">
              <label>문항 유형
                <select className="lab-input" value={current.kind} onChange={e=>{
                  const kind=e.target.value as Kind
                  edit({kind,options:kind==='single'?['','']:[],answer:kind==='single'?0:''})
                }}><option value="single">객관식</option><option value="short">단답형</option></select></label>
              <label>분류<input className="lab-input" value={current.category} maxLength={100}
                onChange={e=>edit({category:e.target.value})}/></label>
            </div>
            <label className="native-field">문제 내용
              <textarea className="lab-input native-question-text" value={current.prompt} maxLength={5000}
                onChange={e=>edit({prompt:e.target.value})} rows={4}/></label>
            {current.kind==='single'?<fieldset className="native-options">
              <legend>보기와 정답</legend>
              {current.options.map((option,i)=><div className="native-option-line" key={i}>
                <input type="radio" checked={current.answer===i} name={'answer-'+current.id}
                  aria-label={(i+1)+'번 정답'} onChange={()=>edit({answer:i})}/>
                <span>{String.fromCharCode(65+i)}</span>
                <input className="lab-input" value={option} maxLength={600} placeholder={'보기 '+(i+1)}
                  onChange={e=>editOption(i,e.target.value)}/>
                <button type="button" className="lab-text-button" disabled={current.options.length<=2}
                  onClick={()=>{const opts=current.options.filter((_,j)=>i!==j);let answer=typeof current.answer==='number'?current.answer:0
                    if(answer===i)answer=0;else if(answer>i)answer--;edit({options:opts,answer})}}>제거</button>
              </div>)}
              <button className="lab-text-button" type="button" disabled={current.options.length>=6}
                onClick={()=>edit({options:[...current.options,'']})}>보기 추가</button>
            </fieldset>:
            <label className="native-field">단답형 정답
              <input className="lab-input" maxLength={300} value={typeof current.answer==='string'?current.answer:''}
                onChange={e=>edit({answer:e.target.value})}/></label>}
            <label className="native-field">힌트 (선택)
              <textarea className="lab-input" rows={2} maxLength={6000} value={current.hint??''}
                onChange={e=>edit({hint:e.target.value})}/></label>
            <label className="native-field">예시 코드 (선택)
              <textarea className="lab-input native-code" rows={4} maxLength={6000} value={current.code??''}
                onChange={e=>edit({code:e.target.value})}/></label>
            <label className="native-field">해설
              <textarea className="lab-input" rows={3} maxLength={2500} value={current.explanation}
                onChange={e=>edit({explanation:e.target.value})}/></label>
          </article>}
          <div className="lab-row-actions native-savebar">
            <button type="button" className="lab-button" disabled={busy||!slug} onClick={()=>void save('save')}>초안 저장</button>
            <button type="button" className="lab-button lab-button-primary" disabled={busy||!slug}
              onClick={()=>void save('publish')}>문제 게시</button>
            {published&&<button type="button" className="lab-button" disabled={busy} onClick={()=>void save('unpublish')}>공개 중단</button>}
            {published&&<a href={'/practice/'+slug} className="lab-button" target="_blank" rel="noreferrer">학생 화면</a>}
          </div>
          {history.length>0&&<div className="native-history">
            <h3>게시 이력</h3>
            {history.map(item=><div className="native-history-row" key={item.version}>
              <div><strong>버전 {item.version}</strong><small>{item.saved_at} · {item.edited_by}</small></div>
              <button className="lab-text-button" type="button" disabled={busy}
                onClick={()=>void save('restore',item.version)}>초안으로 복원</button>
            </div>)}
          </div>}
        </>}
      </div>
    </div>
  </section>
}
