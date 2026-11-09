import type { CollectionConfig } from 'payload'
const teacher=({req}:{req:{user?:{collection?:string}|null}})=>req.user?.collection==='users'

export const LectureAssets: CollectionConfig = {
  slug:'lecture-assets',
  labels:{singular:'JavaScript / CSS 자료',plural:'JavaScript / CSS 자료'},
  admin:{useAsTitle:'path',group:'Frontend Lab'},
  versions:{drafts:false,maxPerDoc:50},
  access:{
    create:teacher,update:teacher,delete:teacher,
    read:({req})=>teacher({req})?true:{status:{equals:'published'}},
  },
  fields:[
    {name:'path',type:'text',required:true,unique:true,index:true,
      label:'JS / CSS 경로',
      admin:{description:'/quiz/html_quiz1.data.js 또는 /assets/css/pages/index.css'},
      validate:(value:unknown)=>typeof value==='string' &&
        /^\/(?:ai|assets|quiz|grid|flex|position|tailwind|javascript|uiux)\/(?:[\w.-]+\/)*[\w.-]+\.(?:js|css)$/i.test(value)
          ? true:'허용된 원본 JavaScript/CSS 경로를 입력해 주세요.',
    },
    {name:'status',type:'select',required:true,defaultValue:'draft',
      options:[{label:'초안',value:'draft'},{label:'게시',value:'published'}]},
    {name:'source',type:'code',required:true,label:'소스 코드',
      admin:{language:'javascript',description:'기존 수업 스타일, 퀴즈 문제, 인터랙션의 소스 편집. 게시하면 즉시 학생에게 적용됩니다.'}},
  ],
}
