import {useEffect,useMemo,useState} from 'react'
import {learningJson} from './MyPage'

type AiStep={slug:string;title:string;summary:string;terms:string}
interface Data{
  slug:string;title:string;summary:string;html:string;revision:number
}
function link(href:string,text:string,primary=false){
  return <a className={'ai-link'+(primary?' primary':'')} href={href}>{text}</a>
}
function AiTabs({step}:{step:number}){
  const entries=[{slug:'ai-index',label:'AI 전체 목차',index:0},
    ...Array.from({length:6},(_,i)=>({
      slug:'ai-step-'+String(i+1).padStart(2,'0'),label:(i+1)+'단계',index:i+1
    }))]
  return <nav className="ai-tabs" aria-label="AI 학습 단계 이동">
    {entries.map(item=><a key={item.slug} href={'/learn/'+item.slug}
      aria-current={step===item.index?'page':undefined}>{item.label}</a>)}
  </nav>
}
function AiHeader({title,subtitle,eyebrow,step}:{title:string;subtitle:string;eyebrow:string;step:number}){
  return <header className="ai-header">
    <a href="/" className="ai-home">Frontend Lab · 강의 홈</a>
    <span className="ai-kicker">{eyebrow}</span>
    <h1>{title}</h1>
    <p>{subtitle}</p>
    <AiTabs step={step}/>
  </header>
}
function AiFooter({step}:{step:number}){
  const n=String(step).padStart(2,'0')
  return <nav className="ai-bottom" aria-label="다른 AI 학습 페이지">
    <h2>다른 학습 페이지로 이동</h2>
    <div className="ai-bottom-links">
      {step>1&&link('/learn/ai-step-'+String(step-1).padStart(2,'0'),'← 이전 단계')}
      {step>0&&link('/practice/original-ai-quiz-'+n,step+'단계 문제 풀기',true)}
      {step>0&&step<6&&link('/learn/ai-step-'+String(step+1).padStart(2,'0'),'다음 단계 →')}
      {step===6&&<a className="ai-link" target="_blank" rel="noopener noreferrer"
        href="https://github.com/JJinMangGo/JJinMangGo/tree/main/ai-system-design-easy">
        심화 읽기 · AI 시스템 설계 20편 →</a>}
      {link('/learn/ai-index','AI 전체 목차')}
      {link('/','Frontend Lab 홈')}
    </div>
  </nav>
}
interface AiTopic{heading:string;definition:string;analogy:string;example:string;point:string}
function parseTopics(html:string):{terms:string;blocks:AiTopic[]}{
  const documentObject=new DOMParser().parseFromString(html,'text/html')
  return {terms:documentObject.querySelector('.ai-terms')?.textContent?.trim()??'',
    blocks:Array.from(documentObject.querySelectorAll('.lesson-block')).map(element=>{
      const p=Array.from(element.querySelectorAll(':scope > p')).map(node=>node.textContent?.trim()??'')
      return {heading:element.querySelector('h2')?.textContent?.trim()??'',
        definition:p[0]??'',analogy:p[1]??'',example:p[2]??'',point:p[3]??''}
    })}
}
export default function AiLesson({data}:{data:Data}){
  const step=data.slug==='ai-index'?0:Number(data.slug.match(/ai-step-(\d+)/)?.[1]??0)
  const [steps,setSteps]=useState<AiStep[]>([])
  const parsed=useMemo(()=>parseTopics(data.html),[data.html])
  useEffect(()=>{
    const old=document.body.className
    document.body.className='ai-page'
    let cancelled=false
    void learningJson<{steps:AiStep[]}>('/api/content/ai-steps')
      .then(result=>{if(!cancelled)setSteps(result.steps)})
      .catch(()=>{})
    return()=>{cancelled=true;document.body.className=old}
  },[])
  return <main id="ai-lessons" className="ai-shell" data-step={step}>
    {step===0?<AiHeader title="AI 기초부터 에이전트까지"
      subtitle="어려운 AI 용어를 쉬운 비유와 실무 사례로 배우는 6단계 학습 과정"
      eyebrow="AI LEARNING · 6 STEPS" step={0}/>:
      <AiHeader title={data.title} subtitle={data.summary}
        eyebrow={'AI LEARNING · STEP '+String(step).padStart(2,'0')} step={step}/>}
    {step===0?<>
      <div className="ai-grid">
        {steps.map((item,i)=><article className="ai-step-card" key={item.slug}>
          <div className="ai-k">{'STEP '+String(i+1).padStart(2,'0')}</div>
          <h2>{item.title}</h2>
          <p className="desc">{item.summary}</p>
          <p className="terms">{item.terms}</p>
          <div className="ai-actions">
            {link('/learn/'+item.slug,'이론 학습',true)}
            {link('/practice/original-ai-quiz-'+String(i+1).padStart(2,'0'),'10문제 풀기')}
          </div>
        </article>)}
      </div>
      <section className="ai-summary ai-advanced">
        <div className="ai-k">NEXT STEP · 심화 읽기</div>
        <h2>AI 시스템 설계, 실제 서비스까지 이해하기</h2>
        <p>6단계 이론과 퀴즈를 마쳤다면, 토큰·RAG·에이전트·MCP부터 AI UX·평가·배포까지 연결하는 한국어 해설 20편을 읽어보세요.</p>
        <div className="ai-actions"><a className="ai-link primary" target="_blank"
          rel="noopener noreferrer" href="https://github.com/JJinMangGo/JJinMangGo/tree/main/ai-system-design-easy">
          AI 시스템 설계 해설 20편 읽기 →</a></div>
      </section>
    </>:<>
      <section className="ai-summary">
        <h2>이번 시간에 배울 것</h2>
        <p>{data.summary}</p>
        <div className="ai-keywords">{parsed.terms.split(' · ').filter(Boolean).map(x=><span key={x}>{x}</span>)}</div>
      </section>
      {parsed.blocks.map((item,i)=><section className="ai-topic" key={i}>
        <div className="ai-k">PART {String(i+1).padStart(2,'0')}</div>
        <h2>{item.heading}</h2>
        <p className="definition">{item.definition}</p>
        <div className="ai-example"><strong>쉽게 이해하기</strong><p>{item.analogy}</p></div>
        <div className="ai-case"><strong>수업·실무 사례</strong><p>{item.example}</p></div>
        <div className="ai-point"><strong>핵심 기억하기</strong><p>{item.point}</p></div>
      </section>)}
    </>}
    <AiFooter step={step}/>
    <p className="ai-footer">JJinMangGo · Frontend Lab AI Learning</p>
  </main>
}
