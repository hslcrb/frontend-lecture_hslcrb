import {useEffect,useMemo,useState} from 'react'
import parse from 'html-react-parser'
import {learningJson} from './MyPage'
import {safeLessonHtml} from './LessonPage'

type Answer=number|string|null
interface Question{
  id:string;kind:'single'|'short';prompt:string;category:string;options:string[]
  hint?:string;code?:string;tree?:string;preview?:string
}
interface Quiz{
  slug:string;title:string;description:string;version:number;questions:Question[]
}
interface Feedback{matched:boolean;correct:number|string;explanation:string}
interface Result{
  attemptId:string;score:number;correct:number;total:number;results:boolean[]
  review:Array<{id:string;correct:number|string;explanation:string;matched:boolean}>
}
function rich(s:string,htmlQuiz:boolean){
  return htmlQuiz?s:parse(safeLessonHtml(s,'/',null))
}

export default function PracticeQuiz(){
  const slug=window.location.pathname.replace(/^\/practice\//,'').replace(/\/$/,'')
  const [quiz,setQuiz]=useState<Quiz|null>(null)
  const [answers,setAnswers]=useState<Answer[]>([])
  const [feedback,setFeedback]=useState<Record<number,Feedback>>({})
  const [index,setIndex]=useState(0)
  const [result,setResult]=useState<Result|null>(null)
  const [draftText,setDraftText]=useState('')
  const [loading,setLoading]=useState(true)
  const [checking,setChecking]=useState(false)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const isAi=/^original-ai-quiz-\d{2}$/.test(slug)
  const htmlQuiz=/^original-quiz-html/.test(slug)
  const step=isAi?Number(slug.slice(-2)):0
  const home=isAi?'/learn/ai-index':'/'
  useEffect(()=>{
    const previous=document.body.className
    document.body.className='quiz-app'
    let disposed=false
    void learningJson<Quiz>('/api/quiz/managed/'+encodeURIComponent(slug)).then(data=>{
      if(disposed)return
      setQuiz(data)
      setAnswers(Array(data.questions.length).fill(null))
      setLoading(false)
      document.title=data.title+' | Frontend Lab'
    }).catch(e=>{if(!disposed){setError(e instanceof Error?e.message:'퀴즈를 불러오지 못했습니다.');setLoading(false)}})
    return()=>{disposed=true;document.body.className=previous}
  },[slug])
  const current=quiz?.questions[index]
  const done=answers.filter(v=>v!==null&&v!=='').length
  const checked=feedback[index]
  const scoreMessage=useMemo(()=>!result?'':result.score>=90?'핵심 개념을 정확하게 이해했어요.':
    result.score>=70?'잘했어요. 오답을 다시 확인해 보세요.':
    result.score>=50?'핵심 개념을 복습하면 더 좋아질 거예요.':'이론을 다시 읽고 도전해 보세요.',[result])
  async function select(value:number|string){
    if(!quiz||checking||feedback[index])return
    if(typeof value==='string'&&!value.trim())return
    setChecking(true);setError('')
    try{
      const response=await learningJson<Feedback>('/api/quiz/managed/'+quiz.slug+'/check',{
        method:'POST',headers:{'Content-Type':'application/json','X-Frontend-Lab':'quiz-submit'},
        body:JSON.stringify({version:quiz.version,index,answer:value})
      })
      setAnswers(old=>old.map((prev,i)=>i===index?value:prev))
      setFeedback(old=>({...old,[index]:response}))
    }catch(e){setError(e instanceof Error?e.message:'답안을 확인하지 못했습니다.')}
    finally{setChecking(false)}
  }
  async function submit(){
    if(!quiz||saving)return
    setSaving(true);setError('')
    try{
      const response=await learningJson<Result>('/api/quiz/managed/'+quiz.slug+'/submit',{
        method:'POST',headers:{'Content-Type':'application/json','X-Frontend-Lab':'quiz-submit'},
        body:JSON.stringify({version:quiz.version,answers})
      })
      setResult(response)
    }catch(e){setError(e instanceof Error?e.message:'결과를 저장하지 못했습니다.')}
    finally{setSaving(false)}
  }
  function restart(){
    if(!quiz)return
    setAnswers(Array(quiz.questions.length).fill(null))
    setFeedback({});setIndex(0);setDraftText('');setResult(null);setError('')
  }
  if(loading)return <main className="quiz-shell" aria-live="polite">문제를 불러오는 중입니다…</main>
  if(!quiz||!current)return <main className="quiz-shell"><a className="quiz-home" href="/">Frontend Lab · 강의 홈</a>
    <p role="alert">{error||'문제를 찾을 수 없습니다.'}</p></main>
  const finished=result!==null
  const total=quiz.questions.length
  return <main className="quiz-shell">
    <header className="quiz-header">
      <a href={home} className="quiz-home">{isAi?'AI 6단계 학습 목차':'Frontend Lab · 강의 홈'}</a>
      <span className="quiz-kicker">{isAi?'AI LEARNING · STEP '+String(step).padStart(2,'0'):
        htmlQuiz?'HTML PRACTICE QUIZ':'CSS PRACTICE QUIZ'}</span>
      <h1>{quiz.title}</h1>
      <p>{quiz.description||'학습 내용을 확인하는 문제풀이'}</p>
    </header>
    <section className="quiz-panel" aria-label="문제풀이">
      {finished?<div className="quiz-score">
        <h2>퀴즈 결과</h2>
        <div className="quiz-score-number">{result.score}점</div>
        <p className="quiz-score-message">{scoreMessage}</p>
        <div className="quiz-score-stats">
          <div className="quiz-score-stat"><strong>{result.correct}</strong><span>정답</span></div>
          <div className="quiz-score-stat"><strong>{done-result.correct}</strong><span>오답</span></div>
          <div className="quiz-score-stat"><strong>{total-done}</strong><span>미응답</span></div>
        </div>
        <h3>문제 다시 보기</h3>
        <div className="quiz-revisit">
          {quiz.questions.map((_,i)=><button key={i} type="button" className="quiz-btn" onClick={()=>{
            setIndex(i);setResult(null)
          }}>{i+1}번 {answers[i]===null?'미응답':result.results[i]?'정답':'오답'}</button>)}
        </div>
        <button className="quiz-btn primary" type="button" onClick={restart}>처음부터 다시 풀기</button>
        <p className="quiz-footer"><a href="/me">내 학습 기록 보기 →</a></p>
      </div>:<>
        <div className="quiz-progress-row"><span>문제 <strong>{index+1} / {total}</strong></span>
          <span>{done} / {total} 완료</span></div>
        <div className="quiz-progress-track" role="progressbar" aria-label="학습 진행"
          aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>
          <div className="quiz-progress-fill" style={{width:Math.round(done/total*100)+'%'}}/>
        </div>
        <div className="quiz-meta"><span className="quiz-number">{index+1} / {total}</span>
          {current.category&&<span className="quiz-category">{current.category}</span>}
        </div>
        <h2 className="quiz-question">{rich(current.prompt,htmlQuiz)}</h2>
        {current.hint&&<div className="quiz-hint"><strong>힌트</strong> — {current.hint}</div>}
        {current.tree&&<pre className="quiz-tree">{current.tree}</pre>}
        {current.code&&<pre className="quiz-sample"><code>{current.code}</code></pre>}
        {current.preview&&<div className="quiz-preview">{rich(current.preview,false)}</div>}
        <div className="quiz-options">
          {current.kind==='short'?<>
            <input className="quiz-input" type="text" aria-label="단답형 정답" placeholder="정답을 입력하세요"
              disabled={Boolean(checked)||checking} value={checked?String(answers[index]??''):draftText}
              onChange={e=>setDraftText(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter')void select(draftText)}}/>
            {!checked&&<button type="button" className="quiz-btn primary quiz-input-submit" disabled={checking||!draftText.trim()}
              onClick={()=>void select(draftText)}>정답 확인</button>}
          </>:
          current.options.map((option,i)=>{
            const correct=checked&&checked.correct===i
            const wrong=checked&&answers[index]===i&&!checked.matched
            return <button key={i} type="button" className={'quiz-choice'+
              (correct?' is-correct':'')+(wrong?' is-wrong':'')}
              disabled={Boolean(checked)||checking} onClick={()=>void select(i)}>
              <span className="quiz-choice-letter">{String.fromCharCode(65+i)}</span>
              <span>{option}</span>
            </button>
          })}
        </div>
        {checked&&<div className={'quiz-feedback '+(checked.matched?'is-correct':'is-wrong')} role="status">
          <h3>{checked.matched?'정답입니다.':'오답입니다.'}</h3>
          {!checked.matched&&<p><strong>정답: {typeof checked.correct==='number'?
            current.options[checked.correct]??String(checked.correct):checked.correct}</strong></p>}
          <p>{rich(checked.explanation,htmlQuiz)}</p>
        </div>}
        {error&&<p role="alert" className="quiz-feedback is-wrong">{error}</p>}
        <div className="quiz-navigation">
          <button type="button" className="quiz-btn" disabled={index===0||checking||saving}
            onClick={()=>{setIndex(i=>Math.max(0,i-1));setDraftText('')}}>← 이전</button>
          <span className="quiz-navigation-note">{done}문제 완료</span>
          <button type="button" className="quiz-btn primary" disabled={checking||saving}
            onClick={()=>{if(index===total-1)void submit();else{setIndex(i=>i+1);setDraftText('')}}}>
            {saving?'저장 중…':index===total-1?'결과 보기':'다음 →'}</button>
        </div>
      </>}
    </section>
    <p className="quiz-footer">{isAi?<><a href={'/learn/ai-step-'+String(step).padStart(2,'0')}>← {step}단계 이론 다시 보기</a>
      {' · '}<a href="/learn/ai-index">AI 전체 목차</a></>:
      '정답을 선택하면 해설이 표시돼요. 마지막 문제에서 결과를 확인할 수 있어요.'}</p>
  </main>
}
