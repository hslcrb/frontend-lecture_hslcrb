import {useEffect,useState,type FormEvent} from 'react'
import {learningJson} from './MyPage'
import './learning.css'

interface Question {
  id:string;kind:'single'|'short';prompt:string;category:string;options:string[];hint?:string;code?:string;tree?:string;preview?:string
}
interface Quiz {
  slug:string;title:string;description:string;version:number;questions:Question[]
}
interface Result{
  attemptId:string;score:number;correct:number;total:number;
  results:boolean[];
  review:Array<{id:string;correct:number|string;explanation:string;matched:boolean}>
}
export default function PracticeQuiz(){
  const slug=window.location.pathname.replace(/^\/practice\//,'').replace(/\/$/,'')
  const [quiz,setQuiz]=useState<Quiz|null>(null)
  const [answers,setAnswers]=useState<Array<number|string|null>>([])
  const [index,setIndex]=useState(0)
  const [result,setResult]=useState<Result|null>(null)
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  useEffect(()=>{
    let closed=false
    void learningJson<Quiz>('/api/quiz/managed/'+encodeURIComponent(slug))
      .then(data=>{if(!closed){setQuiz(data);setAnswers(Array(data.questions.length).fill(null));setLoading(false)}})
      .catch(e=>{if(!closed){setError(e instanceof Error?e.message:'퀴즈를 불러오지 못했습니다.');setLoading(false)}})
    return()=>{closed=true}
  },[slug])
  const current=quiz?.questions[index]
  const answered=answers.filter(a=>a!==null&&a!=='').length
  function change(value:number|string|null){
    setAnswers(old=>old.map((answer,i)=>i===index?value:answer))
  }
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault()
    if(!quiz||saving||result)return
    setSaving(true);setError('')
    try{
      const result=await learningJson<Result>('/api/quiz/managed/'+quiz.slug+'/submit',{
        method:'POST',headers:{'Content-Type':'application/json','X-Frontend-Lab':'quiz-submit'},
        body:JSON.stringify({version:quiz.version,answers}),
      })
      setResult(result)
    }catch(e){setError(e instanceof Error?e.message:'점수를 저장하지 못했습니다.')}
    finally{setSaving(false)}
  }
  if(loading)return <main className="lab-shell"><p>문제를 불러오는 중…</p></main>
  if(!quiz||!current)return <main className="lab-shell"><nav className="lab-topnav"><a href="/me">마이페이지</a></nav><p className="lab-alert">{error||'공개된 문제를 찾지 못했습니다.'}</p></main>
  return <main className="lab-shell">
    <nav className="lab-topnav"><a href="/me">← 마이페이지</a><a href="/">강의 홈</a></nav>
    <header className="lab-heading"><span className="lab-eyebrow">PRACTICE QUIZ</span>
      <h1>{quiz.title}</h1><p>{quiz.description||'문제를 풀고 개인 학습 기록을 남겨 보세요.'}</p></header>
    {result ? <section className="lab-panel lab-results">
      <span className="lab-eyebrow">SAVED TO MY LEARNING</span><h2>퀴즈 완료</h2>
      <strong className="lab-result-score">{result.score}<small> / 100</small></strong>
      <p>정답 {result.correct} / {result.total}문항 · 결과가 내 마이페이지에 저장됐어요.</p>
      <h3>문제별 결과</h3>
      <div className="lab-review">
        {quiz.questions.map((q,i)=><details key={q.id}>
          <summary><span>{i+1}. {q.prompt}</span>
            <b className={result.results[i]?'lab-good':'lab-wrong'}>{result.results[i]?'정답':'오답'}</b></summary>
          <p>정답: {typeof result.review[i]?.correct==='number'?
            q.options[result.review[i].correct as number] : result.review[i]?.correct}</p>
          <p>{result.review[i]?.explanation||'해설이 없습니다.'}</p>
        </details>)}
      </div>
      <div className="lab-row-actions"><a className="lab-button lab-button-primary" href="/me">마이페이지에서 기록 보기</a>
        <button type="button" className="lab-button" onClick={()=>{setResult(null);setAnswers(Array(quiz.questions.length).fill(null));setIndex(0)}}>다시 풀기</button></div>
    </section>:
    <form className="lab-panel lab-practice" onSubmit={submit}>
      <div className="lab-progress-heading"><span>{index+1} / {quiz.questions.length} 문제</span>
        <span>{answered}개 답변</span></div>
      <div className="lab-track"><span style={{width:((index+1)/quiz.questions.length*100)+'%'}}/></div>
      {current.category&&<div className="lab-quiz-type">{current.category}</div>}
      <h2>{current.prompt}</h2>
      {current.hint&&<details className="native-quiz-hint"><summary>힌트 보기</summary><p>{current.hint}</p></details>}
      {current.tree&&<pre className="native-quiz-code">{current.tree}</pre>}
      {current.code&&<pre className="native-quiz-code"><code>{current.code}</code></pre>}
      {current.preview&&<details className="native-quiz-hint"><summary>예시 내용</summary>
        <pre className="native-quiz-code">{current.preview}</pre></details>}
      {current.kind==='single'?<fieldset className="lab-choice-list"><legend className="lab-visually-hidden">보기 중 정답 하나를 선택하세요.</legend>
        {current.options.map((option,i)=><label className={'lab-choice '+(answers[index]===i?'selected':'')} key={i}>
          <input type="radio" name={'answer-'+current.id} value={i} checked={answers[index]===i} onChange={()=>change(i)}/>
          <span className="lab-choice-num">{String.fromCharCode(65+i)}</span><span>{option}</span>
        </label>)}
      </fieldset>:<div className="lab-short-answer">
        <label htmlFor="short-answer">단답형 답안</label>
        <input id="short-answer" type="text" maxLength={300} value={typeof answers[index]==='string'?answers[index] as string:''}
          onChange={e=>change(e.target.value||null)} placeholder="정답을 입력해 주세요."/>
      </div>}
      {error&&<p className="lab-alert" role="alert">{error}</p>}
      <div className="lab-row-actions">
        <button type="button" className="lab-button" disabled={index===0} onClick={()=>setIndex(i=>Math.max(0,i-1))}>이전 문제</button>
        {index<quiz.questions.length-1?<button type="button" className="lab-button lab-button-primary" onClick={()=>setIndex(i=>Math.min(i+1,quiz.questions.length-1))}>다음 문제</button>:
          <button type="submit" disabled={saving} className="lab-button lab-button-primary">{saving?'점수 계산 중…':'결과 보기·점수 저장'}</button>}
      </div>
      <p className="lab-fineprint">정답은 제출 후 서버에서 계산해 개인 기록에 저장합니다. 학습용 연습 문제입니다.</p>
    </form>}
  </main>
}
