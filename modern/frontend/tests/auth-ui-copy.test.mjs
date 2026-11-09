import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const code=p=>fs.readFileSync(path.join(root,p),'utf8')

test('administrator UI contains only user-facing setup, login, and password recovery copy',()=>{
  const component=code('src/TeacherGate.tsx')
  for(const forbidden of [
    'Google 계정 확인이 끝났습니다.',
    'D1에 해시로 저장됩니다',
    'Google 인증 계정:',
    '재배포 후에도 유지',
    '비밀번호 원문은 서버에 저장하지 않습니다.',
    '12~128자 ·',
  ])assert.equal(component.includes(forbidden),false,forbidden)
  assert.match(component,/비밀번호 찾기/)
  assert.match(component,/재설정 메일 보내기/)
  assert.match(component,/새 비밀번호 설정/)
  assert.match(component,/autoComplete="new-password"/)
  assert.match(component,/minLength=\{12\}/)
})

test('persistent credential and recovery data live in D1, not browser storage',()=>{
  const source=code('worker/teacher-auth.ts')
  assert.match(source,/INSERT INTO lab_teacher_credentials/)
  assert.match(source,/lab_teacher_sessions/)
  assert.match(source,/lab_teacher_reset_tokens/)
  assert.match(source,/AUTH_PEPPER/)
  const ui=code('src/TeacherGate.tsx')
  assert.doesNotMatch(ui,/localStorage|sessionStorage|indexedDB/)
})
