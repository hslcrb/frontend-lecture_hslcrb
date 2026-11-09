import type { GlobalConfig } from 'payload'
const teacher=({req}:{req:{user?:{collection?:string}|null}})=>req.user?.collection==='users'
export const LabSettings: GlobalConfig = {
  slug:'lab-settings',
  label:'강의실 운영 설정',
  admin:{group:'Frontend Lab'},
  access:{read:teacher,update:teacher},
  fields:[
    {name:'teacherNotice',label:'운영 메모(교사 전용)',type:'textarea'},
    {name:'privacyContact',label:'개인정보 관리 연락처',type:'text'},
    {name:'sourceRepository',label:'원본 저장소',type:'text',
      defaultValue:'https://github.com/JJinMangGo/frontend-lecture'},
  ],
}
