import type { CollectionConfig } from 'payload'
const teacher = ({req}:{req:{user?: {collection?: string}|null}}) => req.user?.collection==='users'

export const LecturePages: CollectionConfig = {
  slug: 'lecture-pages',
  labels: { singular:'강의 페이지', plural:'강의 페이지' },
  admin: { useAsTitle:'title', defaultColumns:['title','path','status','updatedAt'],group:'Frontend Lab' },
  versions: { drafts:false, maxPerDoc:50 },
  access: {
    create:teacher,update:teacher,delete:teacher,
    read:({req})=>teacher({req}) ? true : {status:{equals:'published'}},
  },
  fields: [
    { name:'title', type:'text',required:true,label:'관리용 제목' },
    { name:'path', type:'text',required:true,unique:true,index:true,
      label:'원본 경로',
      admin:{description:'홈페이지는 /, 강의 페이지는 /ai/step-01.html 등 원래 주소를 사용하세요.'},
      validate:(value:unknown)=>{
        if(typeof value!=='string')return '경로를 입력해 주세요.'
        return value==='/' ||
          /^\/(?:ai|grid|flex|position|tailwind|javascript|quiz|uiux)\/(?:[\w.-]+\/)*[\w.-]+\.html?$/i.test(value)
          || '허용되지 않는 강의 HTML 경로입니다.'
      },
    },
    { name:'status', type:'select',required:true,defaultValue:'draft',
      label:'공개 상태',
      options:[{label:'초안',value:'draft'},{label:'게시',value:'published'}],
    },
    { name:'html', type:'code',required:true,label:'HTML 원본/수정 내용',
      admin:{language:'html',description:'홈(/)은 body 안의 HTML만, 다른 강의는 전체 HTML을 입력합니다.'},
    },
  ],
}
