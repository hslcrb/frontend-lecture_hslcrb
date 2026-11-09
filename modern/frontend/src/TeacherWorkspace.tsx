import {useState} from 'react'
import TeacherAnalytics from './TeacherAnalytics'
import QuizStudio from './QuizStudio'
import AdminConsole from './Admin'
import './learning.css'

type Tab='analytics'|'questions'|'files'
const tabs:Array<{id:Tab;label:string;description:string}>=[
  {id:'analytics',label:'학습 현황',description:'학생별 점수·통계'},
  {id:'questions',label:'문제 관리',description:'문항 추가·수정·게시'},
  {id:'files',label:'강의 파일 CMS',description:'HTML·CSS·JS 편집'},
]
export default function TeacherWorkspace(){
  const [selected,setSelected]=useState<Tab>('analytics')
  return <div className="lab-workspace">
    <header className="lab-workspace-head">
      <div><span className="lab-eyebrow">FRONTEND LAB · ADMIN</span>
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
    <footer className="lab-footer">Frontend Lab · Cloudflare Workers Free · 등록된 학생의 학습 기록은 교사 전용입니다.</footer>
  </div>
}
