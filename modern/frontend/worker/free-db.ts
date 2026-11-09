import type { D1Database } from '@cloudflare/workers-types'
import type { VerifiedIdentity } from './auth'

export type D1 = D1Database
export type ContentKind = 'html' | 'css' | 'js'
export type PublicationState = 'original' | 'published' | 'hidden'
export interface Student {
  access_subject: string
  email: string
  student_name: string
}
export interface ContentEntry {
  path: string
  kind: ContentKind
  draft_source: string
  published_source: string | null
  hidden: number
  updated_at: string
  published_at: string | null
  edited_by: string | null
}
export interface VersionEntry {
  id: number
  path: string
  action: string
  previous_source: string | null
  previous_hidden: number
  actor_email: string
  created_at: string
}

const lectureHtml = /^\/(?:ai|grid|flex|position|tailwind|javascript|quiz|uiux)\/(?:[\w.-]+\/)*[\w.-]+\.html?$/i
const sourceAsset = /^\/(?:ai|assets|quiz|grid|flex|position|tailwind|javascript|uiux)\/(?:[\w.-]+\/)*[\w.-]+\.(?:css|js)$/i

export function pathKind(path: string): ContentKind | null {
  if (path === '/' || lectureHtml.test(path)) return 'html'
  if (sourceAsset.test(path)) return path.toLowerCase().endsWith('.css') ? 'css' : 'js'
  return null
}

export async function findStudent(db: D1, id: VerifiedIdentity): Promise<Student | null> {
  const row = await db.prepare(
    'SELECT access_subject, email, student_name FROM lab_students WHERE access_subject = ? LIMIT 1'
  ).bind(id.subject).first<Student>()
  return row ?? null
}

export async function upsertStudent(db: D1, id: VerifiedIdentity, name: string): Promise<Student> {
  await db.prepare(
    "INSERT INTO lab_students(access_subject, email, student_name, updated_at) VALUES (?, ?, ?, datetime('now')) " +
    "ON CONFLICT(access_subject) DO UPDATE SET email = excluded.email, student_name = excluded.student_name, updated_at = datetime('now')"
  ).bind(id.subject, id.email, name).run()
  const updated = await findStudent(db, id)
  if (!updated) throw new Error('Student record could not be saved')
  return updated
}

export async function findEntry(db: D1, path: string): Promise<ContentEntry | null> {
  return (await db.prepare(
    'SELECT path,kind,draft_source,published_source,hidden,updated_at,published_at,edited_by FROM lab_content WHERE path = ? LIMIT 1'
  ).bind(path).first<ContentEntry>()) ?? null
}

export async function getPublished(db: D1, path: string):
  Promise<{ state: PublicationState; source: string | null }> {
  const row = await db.prepare(
    'SELECT published_source,hidden FROM lab_content WHERE path = ? LIMIT 1'
  ).bind(path).first<{published_source: string | null; hidden: number}>()
  if (!row) return { state:'original', source:null }
  if (row.hidden) return { state:'hidden', source:null }
  if (row.published_source === null) return { state:'original', source:null }
  return { state:'published', source:row.published_source }
}

export async function contentList(db: D1) {
  const r = await db.prepare(
    'SELECT path,kind,updated_at,published_at,edited_by,hidden,' +
    '(CASE WHEN published_source IS NULL THEN 0 ELSE 1 END) AS has_published,' +
    '(CASE WHEN published_source IS NOT draft_source THEN 1 ELSE 0 END) AS has_pending_draft ' +
    'FROM lab_content ORDER BY updated_at DESC LIMIT 300'
  ).all()
  return r.results ?? []
}

export async function contentHistory(db: D1, path: string): Promise<VersionEntry[]> {
  const r = await db.prepare(
    'SELECT id,path,action,previous_source,previous_hidden,actor_email,created_at ' +
    'FROM lab_content_versions WHERE path = ? ORDER BY id DESC LIMIT 50'
  ).bind(path).all<VersionEntry>()
  return r.results ?? []
}

async function snapshot(db: D1, path: string, action: string, old: ContentEntry, actor: string) {
  return db.prepare(
    'INSERT INTO lab_content_versions(path,action,previous_source,previous_hidden,actor_email) VALUES (?,?,?,?,?)'
  ).bind(path,action,old.published_source,old.hidden,actor)
}

export async function saveDraft(db: D1, path: string, source: string, actor: string): Promise<void> {
  const kind = pathKind(path)
  if (!kind) throw new Error('지원하지 않는 강의·자료 경로입니다.')
  if (!source.trim() || source.length > 800000) throw new Error('내용은 1~800,000자로 입력해 주세요.')
  await db.prepare(
    "INSERT INTO lab_content(path,kind,draft_source,edited_by,updated_at) VALUES (?,?,?,?,datetime('now')) " +
    "ON CONFLICT(path) DO UPDATE SET draft_source=excluded.draft_source,edited_by=excluded.edited_by,updated_at=datetime('now')"
  ).bind(path,kind,source,actor).run()
}

export async function publishDraft(db: D1, path: string, actor: string): Promise<void> {
  const before = await findEntry(db,path)
  if (!before || !before.draft_source.trim()) throw new Error('먼저 초안을 저장해 주세요.')
  await db.batch([
    await snapshot(db,path,'publish',before,actor),
    db.prepare(
      "UPDATE lab_content SET published_source=draft_source,hidden=0,edited_by=?,updated_at=datetime('now'),published_at=datetime('now') WHERE path=?"
    ).bind(actor,path),
  ])
}

export async function setHidden(db: D1, path: string, actor: string, hidden: boolean): Promise<void> {
  const before = await findEntry(db,path)
  if (!before) throw new Error('먼저 초안을 저장해 주세요.')
  await db.batch([
    await snapshot(db,path,hidden?'hide':'show',before,actor),
    db.prepare(
      "UPDATE lab_content SET hidden=?,edited_by=?,updated_at=datetime('now') WHERE path=?"
    ).bind(hidden?1:0,actor,path),
  ])
}

export async function restoreVersion(db: D1, path: string, id: number, actor: string): Promise<void> {
  const before = await findEntry(db,path)
  if (!before) throw new Error('원본 자료를 찾지 못했습니다.')
  const version = await db.prepare(
    'SELECT previous_source,previous_hidden FROM lab_content_versions WHERE id=? AND path=?'
  ).bind(id,path).first<{ previous_source: string | null; previous_hidden: number }>()
  if (!version) throw new Error('선택한 수정 이력이 없습니다.')
  await db.batch([
    await snapshot(db,path,'restore',before,actor),
    db.prepare(
      "UPDATE lab_content SET published_source=?,draft_source=?,hidden=?,edited_by=?,updated_at=datetime('now'),published_at=datetime('now') WHERE path=?"
    ).bind(version.previous_source,version.previous_source??before.draft_source,version.previous_hidden,actor,path),
  ])
}
