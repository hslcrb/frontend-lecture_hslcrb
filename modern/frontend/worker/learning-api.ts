import type { D1 } from './free-db'
import type { VerifiedIdentity } from './auth'
import {
  ensureStudentId, myLearningSummary, learningOverview, teacherStudentDetail, getQuiz,
  listManagedQuizzes, validateQuizDraft, gradeAnswers, redactQuestion,
  saveQuizDraft, publishQuiz, unpublishQuiz, restoreQuiz, quizVersions,
  saveAttempt, type Answer,
} from './learning-db'

interface Env {
  DB: D1
  ASSETS: {fetch:(request:Request)=>Promise<Response>}
}
function json(obj:unknown,status=200):Response {
  return new Response(JSON.stringify(obj),{status,headers:{
    'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'
  }})
}
const bad=(message:string,status=400)=>json({error:message},status)
async function content(req:Request,maxLength=160000):Promise<Record<string,unknown>>{
  const url=new URL(req.url)
  if(req.method!=='POST'||req.headers.get('Origin')!==url.origin||
     !req.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')||
     !['quiz-submit','quiz-author'].includes(req.headers.get('X-Frontend-Lab')??'')) {
    throw new Error('요청 출처 또는 형식이 잘못되었습니다.')
  }
  const body=await req.text()
  if(body.length>maxLength)throw new Error('전송한 내용이 너무 큽니다.')
  let data:unknown
  try{data=JSON.parse(body)}catch{throw new Error('JSON 형식이 올바르지 않습니다.')}
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('요청 값이 올바르지 않습니다.')
  return data as Record<string,unknown>
}
const toAnswers=(raw:unknown):Answer[]=>{
  if(!Array.isArray(raw)||raw.length>100)throw new Error('답안 배열이 올바르지 않습니다.')
  return raw.map(v=>{
    if(v===null)return null
    if(typeof v==='number' && Number.isSafeInteger(v) && v>=0 && v<100)return v
    if(typeof v==='string' && v.length<=500)return v
    throw new Error('지원하지 않는 답안 값입니다.')
  })
}
function safeMessage(e:unknown) {
  const s=e instanceof Error?e.message:'처리할 수 없는 오류'
  if(s.startsWith('D1_')||s.includes('SQLITE')||s.includes('constraint'))return '데이터를 저장하지 못했습니다.'
  return s.length>220?'요청을 처리하지 못했습니다.':s
}
export async function handleStudentLearningApi(
  req:Request,env:Env,identity:VerifiedIdentity,
):Promise<Response> {
  const url=new URL(req.url)
  try{
    // All routes are called only after separately registered student-name auth.
    if(url.pathname==='/api/me' && req.method==='GET'){
      await ensureStudentId(env.DB,identity)
      return json(await myLearningSummary(env.DB,identity))
    }
    if(url.pathname==='/api/quiz/catalog' && req.method==='GET'){
      const managed=await listManagedQuizzes(env.DB)
      return json({managed:managed.map(q=>({
        slug:q.slug,title:q.title,description:q.description,version:q.published_version,kind:'managed'
      })),legacy:[]})
    }
    const managed=url.pathname.match(/^\/api\/quiz\/managed\/([a-z0-9-]{3,60})(?:\/submit)?$/)
    if(managed){
      const slug=managed[1]
      const quiz=await getQuiz(env.DB,slug)
      if(!quiz||quiz.published_json===null)return bad('현재 공개된 문제가 없습니다.',404)
      const questions=validateQuizDraft(JSON.parse(quiz.published_json))
      if(req.method==='GET' && !url.pathname.endsWith('/submit'))
        return json({slug,title:quiz.title,description:quiz.description,version:quiz.published_version,
          questions:questions.map(redactQuestion)})
      if(req.method==='POST' && url.pathname.endsWith('/submit')){
        const input=await content(req,25000)
        if(input.version!==quiz.published_version)
          return bad('문제가 업데이트됐습니다. 새로고침 후 다시 풀어 주세요.',409)
        const answers=toAnswers(input.answers)
        const graded=gradeAnswers(questions,answers)
        const profile=await ensureStudentId(env.DB,identity)
        const attemptId=await saveAttempt(env.DB,identity,profile,{
          quizKey:'managed:'+slug,title:quiz.title,kind:'managed',
          version:quiz.published_version,correct:graded.correct,total:graded.total,score:graded.score
        })
        return json({attemptId,score:graded.score,correct:graded.correct,total:graded.total,
          results:graded.results,review:questions.map((q,i)=>({id:q.id,correct:q.answer,
            explanation:q.explanation,matched:graded.results[i]}))})
      }
      return bad('지원하지 않는 요청입니다.',405)
    }
    return bad('학습 API 경로가 없습니다.',404)
  }catch(e) {
    const message=safeMessage(e)
    console.warn('Student learning request rejected:',message)
    return bad(message,/등록|문제 업데이트|limit|한도|최대 40|기준이 필요/.test(message)?409:400)
  }
}
export async function handleTeacherLearningApi(
  req:Request,env:Env,identity:VerifiedIdentity,
):Promise<Response>{
  const url=new URL(req.url)
  try{
    if(url.pathname==='/api/admin/learning'&&req.method==='GET')
      return json(await learningOverview(env.DB))
    if(url.pathname==='/api/admin/learning/student'&&req.method==='GET'){
      const id=url.searchParams.get('studentId')??''
      const found=await teacherStudentDetail(env.DB,id)
      return found?json(found):bad('학생을 찾을 수 없습니다.',404)
    }
    if(url.pathname==='/api/admin/quizzes'&&req.method==='GET')
      return json({quizzes:await listManagedQuizzes(env.DB,false)})
    if(url.pathname==='/api/admin/quiz'&&req.method==='GET'){
      const slug=url.searchParams.get('slug')??''
      const q=await getQuiz(env.DB,slug)
      if(!q)return bad('문제를 찾을 수 없습니다.',404)
      const versions=await quizVersions(env.DB,slug)
      return json({quiz:{slug:q.slug,title:q.title,description:q.description,
        questions:JSON.parse(q.draft_json),published:q.published_json!==null,
        version:q.published_version,updatedAt:q.updated_at},versions})
    }
    if(url.pathname==='/api/admin/quiz'&&req.method==='POST'){
      const input=await content(req,160000)
      if(req.headers.get('X-Frontend-Lab')!=='quiz-author')return bad('관리자 편집 요청이 아닙니다.',403)
      const action=input.action
      if(action==='save'){
        const result=await saveQuizDraft(env.DB,input,identity.email)
        return json({ok:true,action,result})
      }
      const slug=typeof input.slug==='string'?input.slug:''
      if(action==='publish')
        return json({ok:true,action,result:await publishQuiz(env.DB,slug,identity.email)})
      if(action==='unpublish'){
        await unpublishQuiz(env.DB,slug,identity.email)
        return json({ok:true,action})
      }
      if(action==='restore'){
        if(typeof input.version!=='number'||!Number.isSafeInteger(input.version))
          return bad('복원할 버전을 선택해 주세요.')
        return json({ok:true,action,result:await restoreQuiz(env.DB,slug,input.version,identity.email)})
      }
      return bad('지원하지 않는 편집 작업입니다.')
    }
    return bad('관리 API 경로가 없습니다.',404)
  }catch(e){
    const message=safeMessage(e)
    console.warn('Teacher learning request rejected:',message)
    return bad(message,400)
  }
}
