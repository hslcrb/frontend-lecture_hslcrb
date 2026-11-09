import {useEffect,useState} from 'react'
import BlueRenaissanceBrand from './BlueRenaissanceBrand'
import TeacherAnalytics from './TeacherAnalytics'
import QuestionBank from './QuestionBank'
import CourseStudio from './CourseStudio'
import RoleManager from './RoleManager'
import './learning.css'

type CmsRole='creator'|'teacher'|'admin'
type Tab='analytics'|'questions'|'files'|'roles'
const tabs:Array<{id:Tab;label:string;description:string}>=[
  {id:'analytics',label:'학습 현황',description:'학생별 점수·통계'},
  {id:'questions',label:'문제은행',description:'문항 목록·직접 편집'},
  {id:'files',label:'강의 관리',description:'본문 편집·게시·버전 관리'},
]
export default function TeacherWorkspace({role}:{role:CmsRole}){
  const [selected,setSelected]=useState<Tab>('questions')
  const availableTabs=role==='creator'
    ? [...tabs,{id:'roles' as const,label:'권한 관리',description:'관리자 임명·박탈'}]
    : tabs
  const rank=role==='creator'?'00 · 창조자':role==='teacher'?'01 · 선생님':'02 · 임명 관리자'
  useEffect(()=>{
    const previous=document.title
    document.title='Blue Renaissance CMS · Frontend Lab'
    return()=>{document.title=previous}
  },[])
  return <div className="lab-workspace">
    <header className="lab-workspace-head">
      <div><BlueRenaissanceBrand/>
        <span className="lab-eyebrow">FRONTEND LAB · {rank}</span>
        <h1>교육 운영 대시보드</h1>
        <p>강의 콘텐츠와 학생 학습 기록을 한 곳에서 관리합니다.</p>
      </div>
      <a className="lab-button" href="/">학생 화면</a>
    </header>
    <nav className="lab-admin-tabs" aria-label="관리자 기능">
      {availableTabs.map(tab=><button type="button" key={tab.id}
        className={'lab-admin-tab '+(selected===tab.id?'active':'')}
        aria-current={selected===tab.id?'page':undefined}
        onClick={()=>setSelected(tab.id)}><strong>{tab.label}</strong><small>{tab.description}</small></button>)}
    </nav>
    <div className="lab-workspace-content">
      {selected==='analytics'?<TeacherAnalytics/>:
        selected==='questions'?<QuestionBank/>:
        selected==='roles'&&role==='creator'?<RoleManager/>:<CourseStudio/>}
    </div>
    <footer className="lab-footer">Blue Renaissance CMS · Frontend Lab</footer>
  </div>
}
