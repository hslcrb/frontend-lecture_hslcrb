import {useEffect,useState} from 'react'
import BlueRenaissanceBrand from './BlueRenaissanceBrand'
import TeacherAnalytics from './TeacherAnalytics'
import QuizStudio from './QuizStudio'
import AdminConsole from './Admin'
import './learning.css'

type Tab='analytics'|'questions'|'files'
const tabs:Array<{id:Tab;label:string;description:string}>=[
  {id:'analytics',label:'학습 현황',description:'학생별 점수·통계'},
  {id:'questions',label:'문제 관리',description:'문항 추가·수정·게시'},
  {id:'files',label:'강의 라이브러리',description:'D1 강의·HTML·CSS·JS 편집'},
]
export default function TeacherWorkspace(){
  const [selected,setSelected]=useState<Tab>('analytics')
  useEffect(()=>{
    const previous=document.title
    document.title='Blue Renaissance CMS · Frontend Lab'
    return()=>{document.title=previous}
  },[])
  return <div className="lab-workspace">
    <header className="lab-workspace-head">
      <div><BlueRenaissanceBrand/>
        <span className="lab-eyebrow">FRONTEND LAB · TEACHER CONSOLE</span>
        <h1>교육 운영 대시보드</h1>
        <p>강의 콘텐츠와 학생 학습 기록을 한 곳에서 관리합니다.</p>
      </div>
      <a className="lab-button" href="/">학생 화면</a>
    </header>
    <nav className="lab-admin-tabs" aria-label="관리자 기능">
      {tabs.map(tab=><button type="button" key={tab.id}
        className={'lab-admin-tab '+(selected===tab.id?'active':'')}
        aria-current={selected===tab.id?'page':undefined}
        onClick={()=>setSelected(tab.id)}><strong>{tab.label}</strong><small>{tab.description}</small></button>)}
    </nav>
    <div className="lab-workspace-content">
      {selected==='analytics'?<TeacherAnalytics/>:
        selected==='questions'?<QuizStudio/>:<AdminConsole/>}
    </div>
    <footer className="lab-footer">Blue Renaissance CMS · Cloudflare Workers Free + D1 · 교사 전용 관리 시스템</footer>
  </div>
}
