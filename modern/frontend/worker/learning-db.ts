import type { D1 } from './free-db'
import type { VerifiedIdentity } from './auth'

export interface StudentProfile {
  access_subject: string
  student_id: string
  created_at: string
}
export type Answer = number | string | null
export interface Question {
  id: string
  kind: 'single'|'short'
  prompt: string
  category: string
  options: string[]
  answer: number|string
  explanation: string
}
export interface QuizRow {
  slug: string
  title: string
  description: string
  draft_json: string
  published_json: string|null
  published_version: number
  created_at: string
  updated_at: string
  published_at: string|null
  edited_by: string|null
}
export interface LegacyKey {
  path: string
  dataPath: string
  title: string
  keys: Array<{kind:'single'|'short';answer:number|string}>
}

const slugPattern=/^[a-z0-9][a-z0-9-]{2,59}$/
const nowSQL="datetime('now')"

export async function ensureStudentId(db:D1, identity:VerifiedIdentity):Promise<StudentProfile> {
  const id='FL-'+crypto.randomUUID().toUpperCase()
  await db.prepare(
    "INSERT OR IGNORE INTO lab_student_profiles(access_subject,student_id) " +
    "SELECT access_subject,? FROM lab_students WHERE access_subject=?"
  ).bind(id,identity.subject).run()
  const profile=await db.prepare(
    'SELECT access_subject,student_id,created_at FROM lab_student_profiles WHERE access_subject=?'
  ).bind(identity.subject).first<StudentProfile>()
  if(!profile)throw new Error('Complete student-name registration before using a profile')
  return profile
}

export function validateQuizDraft(raw:unknown):Question[] {
  if(!Array.isArray(raw)||raw.length<1||raw.length>50)
    throw new Error('문제는 1~50개까지 등록할 수 있습니다.')
  const ids=new Set<string>()
  return raw.map((entry,index)=>{
    if(!entry||typeof entry!=='object'||Array.isArray(entry))
      throw new Error((index+1)+'번 문항 형식이 올바르지 않습니다.')
    const q=entry as Record<string,unknown>
    const prompt=typeof q.prompt==='string'?q.prompt.trim():''
    if(!prompt||prompt.length>1500)throw new Error((index+1)+'번 문제 본문은 1~1,500자여야 합니다.')
    const kind=q.kind==='short'?'short':q.kind==='single'?'single':null
    if(!kind)throw new Error((index+1)+'번 문항 유형을 선택해 주세요.')
    const category=typeof q.category==='string'?q.category.trim():''
    if(category.length>100)throw new Error('분류는 100자 이하로 입력해 주세요.')
    const explanation=typeof q.explanation==='string'?q.explanation.trim():''
    if(explanation.length>2500)throw new Error('해설은 2,500자 이하로 입력해 주세요.')
    const id=(typeof q.id==='string'&&/^[a-zA-Z0-9_-]{2,80}$/.test(q.id))?q.id:'q'+(index+1)
    if(ids.has(id))throw new Error('문항 ID가 중복됩니다.')
    ids.add(id)
    let options:string[]=[]
    let answer:number|string
    if(kind==='single') {
      if(!Array.isArray(q.options)||q.options.length<2||q.options.length>6||
        q.options.some(x=>typeof x!=='string'||!x.trim()||x.length>600))
        throw new Error((index+1)+'번 객관식 보기 2~6개를 입력해 주세요.')
      options=q.options.map(x=>(x as string).trim())
      if(typeof q.answer!=='number'||!Number.isInteger(q.answer)||q.answer<0||q.answer>=options.length)
        throw new Error((index+1)+'번 문항 정답 보기를 지정해 주세요.')
      answer=q.answer
    }else{
      if(typeof q.answer!=='string'||!q.answer.trim()||q.answer.length>300)
        throw new Error((index+1)+'번 단답형 정답을 입력해 주세요.')
      answer=q.answer.trim()
    }
    return {id,kind,prompt,category,options,answer,explanation}
  })
}
export function redactQuestion(q:Question) {
  return {id:q.id,kind:q.kind,prompt:q.prompt,category:q.category,options:q.options}
}
export function correctAnswer(expected:number|string, supplied:Answer):boolean {
  if(typeof expected==='number')return typeof supplied==='number' && Number.isInteger(supplied) && supplied===expected
  return typeof supplied==='string' &&
    supplied.trim().replace(/\s+/g,'').toLocaleLowerCase()===
    expected.trim().replace(/\s+/g,'').toLocaleLowerCase()
}
export function gradeAnswers(questions:Array<{answer:number|string}>,answers:Answer[]) {
  if(!Array.isArray(answers)||answers.length!==questions.length||answers.length>100)
    throw new Error('제출한 답안 개수가 문제와 일치하지 않습니다.')
  let correct=0
  const results=questions.map((q,i)=>{
    const answer=answers[i]
    if(answer!==null && typeof answer!=='number'&&typeof answer!=='string')
      throw new Error('지원하지 않는 답안 형식입니다.')
    if(typeof answer==='string'&&answer.length>500)
      throw new Error('단답형 입력이 너무 깁니다.')
    const matched=correctAnswer(q.answer,answer)
    if(matched)correct++
    return matched
  })
  return {correct,total:questions.length,score:Math.round(100*correct/questions.length),results}
}
export async function getQuiz(db:D1,slug:string):Promise<QuizRow|null> {
  if(!slugPattern.test(slug))return null
  return (await db.prepare(
    'SELECT slug,title,description,draft_json,published_json,published_version,created_at,updated_at,published_at,edited_by FROM lab_quiz_sets WHERE slug=?'
  ).bind(slug).first<QuizRow>())??null
}
export async function listManagedQuizzes(db:D1,publishedOnly=true) {
  const rows=await db.prepare(
    'SELECT slug,title,description,published_version,published_at,updated_at,'+
    '(CASE WHEN published_json IS NULL THEN 0 ELSE 1 END) AS is_published FROM lab_quiz_sets '+
    (publishedOnly?'WHERE published_json IS NOT NULL ':'')+
    'ORDER BY updated_at DESC LIMIT 150'
  ).all<{slug:string;title:string;description:string;published_version:number;published_at:string|null;updated_at:string;is_published:number}>()
  return rows.results??[]
}
export async function saveQuizDraft(db:D1,input:Record<string,unknown>,actor:string) {
  const slug=typeof input.slug==='string'?input.slug.trim().toLowerCase():''
  if(!slugPattern.test(slug))throw new Error('영문 소문자·숫자·하이픈을 사용한 3~60자 ID를 입력해 주세요.')
  const title=typeof input.title==='string'?input.title.trim():''
  const description=typeof input.description==='string'?input.description.trim():''
  if(!title||title.length>120||description.length>800)throw new Error('제목(1~120자)과 설명(800자 이하)을 확인해 주세요.')
  const questions=validateQuizDraft(input.questions)
  await db.prepare(
    "INSERT INTO lab_quiz_sets(slug,title,description,draft_json,edited_by) VALUES(?,?,?,?,?) "+
    "ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description,draft_json=excluded.draft_json,edited_by=excluded.edited_by,updated_at=datetime('now')"
  ).bind(slug,title,description,JSON.stringify(questions),actor).run()
  return {slug,count:questions.length}
}
export async function publishQuiz(db:D1,slug:string,actor:string) {
  const row=await getQuiz(db,slug)
  if(!row)throw new Error('먼저 문제 초안을 저장해 주세요.')
  const questions=validateQuizDraft(JSON.parse(row.draft_json))
  if(row.published_version>=100000)throw new Error('버전 번호 한도를 초과했습니다.')
  const version=row.published_version+1
  await db.batch([
    db.prepare(
      "INSERT INTO lab_quiz_versions(slug,version,title,description,questions_json,edited_by) VALUES(?,?,?,?,?,?)"
    ).bind(slug,version,row.title,row.description,JSON.stringify(questions),actor),
    db.prepare(
      "UPDATE lab_quiz_sets SET published_json=?,published_version=?,published_at=datetime('now'),updated_at=datetime('now'),edited_by=? WHERE slug=?"
    ).bind(JSON.stringify(questions),version,actor,slug),
  ])
  return {slug,version,count:questions.length}
}
export async function unpublishQuiz(db:D1,slug:string,actor:string) {
  const row=await getQuiz(db,slug)
  if(!row)throw new Error('문제가 존재하지 않습니다.')
  await db.prepare(
    "UPDATE lab_quiz_sets SET published_json=NULL,published_at=NULL,updated_at=datetime('now'),edited_by=? WHERE slug=?"
  ).bind(actor,slug).run()
}
export async function restoreQuiz(db:D1,slug:string,version:number,actor:string) {
  const row=await getQuiz(db,slug)
  if(!row)throw new Error('퀴즈를 찾지 못했습니다.')
  const item=await db.prepare(
    'SELECT title,description,questions_json FROM lab_quiz_versions WHERE slug=? AND version=?'
  ).bind(slug,version).first<{title:string;description:string;questions_json:string}>()
  if(!item)throw new Error('선택한 문제 버전이 없습니다.')
  const questions=validateQuizDraft(JSON.parse(item.questions_json))
  // Restore to a draft first; this never silently overwrites a currently published version.
  await db.prepare(
    "UPDATE lab_quiz_sets SET title=?,description=?,draft_json=?,updated_at=datetime('now'),edited_by=? WHERE slug=?"
  ).bind(item.title,item.description,JSON.stringify(questions),actor,slug).run()
  return {slug,restoredVersion:version}
}
export async function quizVersions(db:D1,slug:string) {
  const rows=await db.prepare(
    'SELECT id,version,saved_at,edited_by FROM lab_quiz_versions WHERE slug=? ORDER BY version DESC LIMIT 30'
  ).bind(slug).all<{id:number;version:number;saved_at:string;edited_by:string}>()
  return rows.results??[]
}
export async function saveAttempt(db:D1,identity:VerifiedIdentity,profile:StudentProfile,
  details:{quizKey:string;title:string;kind:'managed'|'legacy';version:number;correct:number;total:number;score:number}) {
  const limited=await db.prepare(
    "SELECT COUNT(*) AS count FROM lab_quiz_attempts WHERE access_subject=? AND submitted_at>=datetime('now','-1 day')"
  ).bind(identity.subject).first<{count:number}>()
  if((limited?.count??0)>=40)throw new Error('24시간에 최대 40회까지 점수를 저장할 수 있습니다.')
  const attemptId=crypto.randomUUID()
  await db.prepare(
    'INSERT INTO lab_quiz_attempts(attempt_id,student_id,access_subject,quiz_key,quiz_title,quiz_kind,quiz_version,correct_count,total_count,score_percent) '+
    'VALUES(?,?,?,?,?,?,?,?,?,?)'
  ).bind(attemptId,profile.student_id,identity.subject,details.quizKey,details.title,
    details.kind,details.version,details.correct,details.total,details.score).run()
  return attemptId
}
export async function myLearningSummary(db:D1,identity:VerifiedIdentity) {
  const student=await db.prepare(
    'SELECT s.student_name,s.email,s.created_at,p.student_id FROM lab_students s '+
    'JOIN lab_student_profiles p ON p.access_subject=s.access_subject WHERE s.access_subject=?'
  ).bind(identity.subject).first<{student_name:string;email:string;created_at:string;student_id:string}>()
  if(!student)throw new Error('이름 등록을 완료해 주세요.')
  const [overall, attempts, subjects] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS count,COALESCE(ROUND(AVG(score_percent)),0) AS average,MAX(score_percent) AS best '+
      'FROM lab_quiz_attempts WHERE access_subject=?').bind(identity.subject).first<{count:number;average:number;best:number|null}>(),
    db.prepare('SELECT attempt_id,quiz_key,quiz_title,quiz_kind,score_percent,correct_count,total_count,submitted_at '+
      'FROM lab_quiz_attempts WHERE access_subject=? ORDER BY submitted_at DESC LIMIT 80').bind(identity.subject)
      .all<{attempt_id:string;quiz_key:string;quiz_title:string;quiz_kind:string;score_percent:number;correct_count:number;total_count:number;submitted_at:string}>(),
    db.prepare('SELECT quiz_key,quiz_title,COUNT(*) AS attempts,MAX(score_percent) AS best_score,ROUND(AVG(score_percent)) AS average_score '+
      'FROM lab_quiz_attempts WHERE access_subject=? GROUP BY quiz_key,quiz_title ORDER BY MAX(submitted_at) DESC LIMIT 60')
      .bind(identity.subject).all<{quiz_key:string;quiz_title:string;attempts:number;best_score:number;average_score:number}>()
  ])
  return {student,overall:overall??{count:0,average:0,best:null},attempts:attempts.results??[],subjects:subjects.results??[]}
}
export async function learningOverview(db:D1) {
  const [summary,students,days,byQuiz,recent] = await Promise.all([
    db.prepare('SELECT (SELECT COUNT(*) FROM lab_students) AS students,'+
      '(SELECT COUNT(DISTINCT access_subject) FROM lab_quiz_attempts) AS active_students,'+
      '(SELECT COUNT(*) FROM lab_quiz_attempts) AS attempts,'+
      '(SELECT COALESCE(ROUND(AVG(score_percent)),0) FROM lab_quiz_attempts) AS average_score').first(),
    db.prepare(
      'SELECT s.student_name,s.email,s.created_at,p.student_id,'+
      'COUNT(a.attempt_id) AS attempts,ROUND(AVG(a.score_percent)) AS average_score,'+
      'MAX(a.score_percent) AS best_score,MAX(a.submitted_at) AS last_attempt '+
      'FROM lab_students s LEFT JOIN lab_student_profiles p ON p.access_subject=s.access_subject '+
      'LEFT JOIN lab_quiz_attempts a ON a.access_subject=s.access_subject '+
      'GROUP BY s.access_subject ORDER BY last_attempt DESC,s.created_at DESC LIMIT 300').all(),
    db.prepare(
      "SELECT substr(submitted_at,1,10) AS day,COUNT(*) AS attempts,ROUND(AVG(score_percent)) AS average_score "+
      "FROM lab_quiz_attempts WHERE submitted_at>=datetime('now','-14 days') GROUP BY substr(submitted_at,1,10) ORDER BY day").all(),
    db.prepare(
      'SELECT quiz_key,quiz_title,quiz_kind,COUNT(*) AS attempts,ROUND(AVG(score_percent)) AS average_score '+
      'FROM lab_quiz_attempts GROUP BY quiz_key,quiz_title,quiz_kind ORDER BY attempts DESC LIMIT 20').all(),
    db.prepare(
      'SELECT a.attempt_id,a.quiz_title,a.quiz_kind,a.score_percent,a.submitted_at,'+
      's.student_name,p.student_id FROM lab_quiz_attempts a JOIN lab_students s ON s.access_subject=a.access_subject '+
      'LEFT JOIN lab_student_profiles p ON p.access_subject=s.access_subject '+
      'ORDER BY a.submitted_at DESC LIMIT 30').all()
  ])
  return {summary:summary??{students:0,active_students:0,attempts:0,average_score:0},
    students:students.results??[],days:days.results??[],quizzes:byQuiz.results??[],recent:recent.results??[]}
}
export async function teacherStudentDetail(db:D1,studentId:string) {
  if(!/^FL-[A-F0-9-]{36}$/.test(studentId))throw new Error('올바른 학생 ID가 아닙니다.')
  const profile=await db.prepare(
    'SELECT p.student_id,s.student_name,s.email,s.created_at FROM lab_student_profiles p '+
    'JOIN lab_students s ON p.access_subject=s.access_subject WHERE p.student_id=?'
  ).bind(studentId).first()
  if(!profile)return null
  const scores=await db.prepare(
    'SELECT a.attempt_id,a.quiz_key,a.quiz_title,a.quiz_kind,a.score_percent,a.correct_count,a.total_count,a.submitted_at '+
    'FROM lab_quiz_attempts a WHERE a.student_id=? ORDER BY a.submitted_at DESC LIMIT 100'
  ).bind(studentId).all()
  return {profile,attempts:scores.results??[]}
}
