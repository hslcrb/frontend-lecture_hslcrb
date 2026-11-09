import type {D1} from './free-db'
import type {VerifiedIdentity} from './auth'

interface Env { DB:D1 }
type Lesson = {
  slug:string;source_path:string;title:string;category:string;summary:string;
  draft_html:string;published_html:string|null;published:number;revision:number;
  sort_order:number;updated_at:string;updated_by:string|null
}
const slugValid=(s:string)=>/^[a-z0-9][a-z0-9-]{2,99}$/.test(s)
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
  'X-Content-Type-Options':'nosniff'
}})
const fail=(message:string,status=400)=>reply({error:message},status)
function isProtectedMarkup(value:string):boolean {
  // Server-side coarse safety gate; the React renderer performs DOMParser sanitization.
  return /<\s*(?:script|iframe|object|embed|form|input|meta|link|base|svg|math|style)\b/i.test(value)||
    /\bon[a-z]+\s*=/i.test(value)||
    /(?:javascript|vbscript)\s*:/i.test(value)||
    /data\s*:\s*text\/html/i.test(value)
}
async function lesson(db:D1,slug:string) {
  if(!slugValid(slug))return null
  return await db.prepare(
    'SELECT slug,source_path,title,category,summary,draft_html,published_html,published,revision,sort_order,updated_at,updated_by '+
    'FROM br_lessons WHERE slug=?'
  ).bind(slug).first<Lesson>()
}
async function jsonInput(req:Request) {
  const url=new URL(req.url)
  if(req.method!=='POST'||req.headers.get('Origin')!==url.origin||
     !req.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')||
     req.headers.get('X-Frontend-Lab')!=='course-write')
    throw new Error('허용되지 않은 요청입니다.')
  const raw=await req.text()
  if(raw.length>700000)throw new Error('콘텐츠 크기가 너무 큽니다.')
  const v:unknown=JSON.parse(raw)
  if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('콘텐츠 형식이 올바르지 않습니다.')
  return v as Record<string,unknown>
}
export async function studentContentApi(req:Request,env:Env):Promise<Response>{
  if(req.method!=='GET')return fail('허용되지 않는 요청입니다.',405)
  const url=new URL(req.url)
  if(url.pathname==='/api/content/ai-steps'){
    const data=await env.DB.prepare(
      "SELECT slug,title,summary,published_html FROM br_lessons WHERE slug LIKE 'ai-step-%' AND published=1 ORDER BY slug LIMIT 6"
    ).all<{slug:string;title:string;summary:string;published_html:string|null}>()
    return reply({steps:(data.results??[]).map(row=>({
      slug:row.slug,title:row.title,summary:row.summary,
      terms:/<p class="ai-terms">([^<]*)<\/p>/.exec(row.published_html??'')?.[1]??''
    }))})
  }
  if(url.pathname==='/api/content/home'){
    const row=await env.DB.prepare(
      "SELECT title,published_html,revision FROM br_lessons WHERE slug='home' AND published=1"
    ).first<{title:string;published_html:string|null;revision:number}>()
    if(!row?.published_html)return fail('홈페이지 콘텐츠를 찾을 수 없습니다.',404)
    return reply({title:row.title,html:row.published_html,sourcePath:'/',revision:row.revision})
  }
  if(url.pathname==='/api/content/catalog'){
    const [lessons,quizzes]=await Promise.all([
      env.DB.prepare(
        'SELECT slug,title,category,summary,source_path,revision,updated_at FROM br_lessons '+
        "WHERE published=1 AND (source_path='/' OR source_path NOT LIKE '%quiz%') "+
        'ORDER BY category,sort_order,title LIMIT 150').all(),
      env.DB.prepare(
        'SELECT q.slug,q.title,q.description,q.published_version,json_array_length(q.published_json) AS question_count,'+
        'm.legacy_path FROM lab_quiz_sets q LEFT JOIN br_legacy_quiz_map m ON m.quiz_slug=q.slug '+
        'WHERE q.published_json IS NOT NULL ORDER BY q.title LIMIT 150').all()
    ])
    return reply({lessons:lessons.results??[],quizzes:quizzes.results??[]})
  }
  const match=/^\/api\/content\/lesson\/([a-z0-9-]{3,100})$/.exec(url.pathname)
  if(match){
    const row=await lesson(env.DB,match[1])
    if(!row||row.published!==1||!row.published_html)return fail('공개된 강의를 찾을 수 없습니다.',404)
    return reply({slug:row.slug,title:row.title,category:row.category,
      summary:row.summary,html:row.published_html,revision:row.revision,
      sourcePath:row.source_path})
  }
  return fail('콘텐츠 경로가 없습니다.',404)
}
export async function adminContentApi(req:Request,env:Env,actor:VerifiedIdentity):Promise<Response>{
  const url=new URL(req.url)
  try{
    if(req.method==='GET'){
      if(url.pathname==='/api/admin/native/lessons'){
        const rows=await env.DB.prepare(
          'SELECT slug,source_path,title,category,summary,published,revision,updated_at '+
          'FROM br_lessons WHERE source_path NOT LIKE ? ORDER BY category,sort_order,title LIMIT 200'
        ).bind('%quiz%').all()
        return reply({lessons:rows.results??[]})
      }
      if(url.pathname==='/api/admin/native/lesson'){
        const slug=url.searchParams.get('slug')??''
        const row=await lesson(env.DB,slug)
        if(!row)return fail('강의를 찾지 못했습니다.',404)
        const history=await env.DB.prepare(
          'SELECT id,revision,action,edited_by,created_at FROM br_lesson_versions WHERE slug=? '+
          'ORDER BY id DESC LIMIT 40'
        ).bind(slug).all()
        return reply({lesson:row,history:history.results??[]})
      }
      return fail('관리 API 경로가 없습니다.',404)
    }
    if(url.pathname!=='/api/admin/native/lesson')return fail('관리 API 경로가 없습니다.',404)
    const data=await jsonInput(req),action=String(data.action??'')
    const slug=typeof data.slug==='string'?data.slug.toLowerCase():''
    if(!slugValid(slug))return fail('3~100자의 영문 강의 주소를 입력해 주세요.')
    const row=await lesson(env.DB,slug)
    if(action==='create'){
      if(row)return fail('동일한 주소의 강의가 이미 있습니다.',409)
      const title=typeof data.title==='string'?data.title.trim():''
      if(!title||title.length>180)return fail('강의 제목은 1~180자여야 합니다.')
      await env.DB.prepare(
        'INSERT INTO br_lessons(slug,source_path,title,category,summary,draft_html,published,published_html,updated_by) '+
        "VALUES(?,?,?,?,?,'',0,NULL,?)"
      ).bind(slug,'/managed/'+slug,title,'일반','',actor.email).run()
      return reply({ok:true,slug})
    }
    if(!row)return fail('먼저 강의를 생성해 주세요.',404)
    if(typeof data.baseRevision==='number'&&data.baseRevision!==row.revision)
      return fail('다른 관리자가 이 강의를 수정했습니다. 새로고침 후 다시 편집해 주세요.',409)
    if(action==='save'){
      const title=typeof data.title==='string'?data.title.trim():''
      const category=typeof data.category==='string'?data.category.trim():''
      const summary=typeof data.summary==='string'?data.summary.trim():''
      const html=typeof data.html==='string'?data.html:''
      if(!title||title.length>180||category.length>80||summary.length>900||html.length>420000)
        return fail('강의 제목·분류·본문의 입력 길이를 확인해 주세요.')
      if(isProtectedMarkup(html))return fail('보안상 사용할 수 없는 HTML 태그나 속성이 포함돼 있습니다.')
      await env.DB.prepare(
        "UPDATE br_lessons SET title=?,category=?,summary=?,draft_html=?,updated_at=datetime('now'),updated_by=? WHERE slug=?"
      ).bind(title,category||'일반',summary,html,actor.email,slug).run()
      return reply({ok:true,slug,action})
    }
    if(action==='publish'){
      if(!row.draft_html.trim())return fail('강의 내용을 먼저 저장해 주세요.')
      if(isProtectedMarkup(row.draft_html))return fail('강의 본문에 허용되지 않는 HTML이 포함돼 있습니다.')
      const rev=row.revision+1
      await env.DB.batch([
        env.DB.prepare(
          'INSERT INTO br_lesson_versions(slug,revision,title,summary,body_html,action,edited_by) VALUES(?,?,?,?,?,?,?)'
        ).bind(slug,rev,row.title,row.summary,row.draft_html,'publish',actor.email),
        env.DB.prepare(
          "UPDATE br_lessons SET published_html=draft_html,published=1,revision=?,updated_at=datetime('now'),updated_by=? WHERE slug=?"
        ).bind(rev,actor.email,slug)
      ])
      return reply({ok:true,revision:rev})
    }
    if(action==='hide'||action==='show'){
      await env.DB.prepare(
        "UPDATE br_lessons SET published=?,updated_at=datetime('now'),updated_by=? WHERE slug=?"
      ).bind(action==='show'?1:0,actor.email,slug).run()
      return reply({ok:true,visible:action==='show'})
    }
    if(action==='restore'){
      const id=data.versionId
      if(typeof id!=='number'||!Number.isSafeInteger(id))return fail('복원할 버전을 선택해 주세요.')
      const revision=await env.DB.prepare(
        'SELECT title,summary,body_html FROM br_lesson_versions WHERE slug=? AND id=?'
      ).bind(slug,id).first<{title:string;summary:string;body_html:string}>()
      if(!revision)return fail('이전 버전을 찾지 못했습니다.',404)
      await env.DB.prepare(
        "UPDATE br_lessons SET title=?,summary=?,draft_html=?,updated_at=datetime('now'),updated_by=? WHERE slug=?"
      ).bind(revision.title,revision.summary,revision.body_html,actor.email,slug).run()
      return reply({ok:true,slug,restoredDraft:true})
    }
    return fail('지원하지 않는 작업입니다.')
  }catch(e){
    console.error('Blue Renaissance D1 lesson request failed',e instanceof Error?e.name:'unknown')
    const msg=e instanceof Error?e.message:'요청을 처리할 수 없습니다.'
    return fail(/SQLite|D1_ERROR|constraint/i.test(msg)?'강의 데이터를 저장하지 못했습니다.':msg,400)
  }
}
