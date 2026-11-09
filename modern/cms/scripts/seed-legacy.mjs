import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {replaceCardEmojis,stripLegacyAnalytics} from '../../frontend/scripts/sync-original.mjs'

const root=path.resolve(process.env.SOURCE_REPO_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)),'../../..'))
const base=process.env.CMS_URL
const email=process.env.CMS_ADMIN_EMAIL
const password=process.env.CMS_ADMIN_PASSWORD
const cookie=process.env.CF_AUTH_COOKIE
if(!base||!email||!password||!fs.existsSync(path.join(root,'DESIGN.md'))) {
  throw new Error('Set CMS_URL, CMS_ADMIN_EMAIL, CMS_ADMIN_PASSWORD and use a complete upstream checkout.')
}
const common={'Content-Type':'application/json'}
if(cookie)common.Cookie='CF_Authorization='+cookie
const login=await fetch(new URL('/api/users/login',base),{
  method:'POST',headers:common,body:JSON.stringify({email,password}),
})
if(!login.ok)throw new Error('CMS authentication failed: HTTP '+login.status)
const signed=await login.json()
if(!signed.token)throw new Error('Payload returned no login token')
const headers={...common,Authorization:'JWT '+signed.token}
async function api(url,init={}) {
  const response=await fetch(new URL(url,base),{...init,headers:{...headers,...init.headers}})
  if(!response.ok)throw new Error('CMS '+url+' returned HTTP '+response.status+': '+(await response.text()).slice(0,180))
  return response.json()
}
const directories=['ai','assets','flex','grid','javascript','position','quiz','tailwind','uiux']
function scan(folder) {
  let files=[]
  if(!fs.existsSync(folder))return files
  for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
    const file=path.join(folder,entry.name)
    if(entry.isDirectory())files.push(...scan(file))
    else if(entry.isFile() && /\.(?:html?|css|js)$/i.test(file))files.push(file)
  }
  return files
}
const sources=[path.join(root,'index.html'),...directories.flatMap(dir=>scan(path.join(root,dir)))]
let created=0,skipped=0
for(const file of sources){
  const rel=path.relative(root,file).split(path.sep).join('/')
  const home=rel==='index.html'
  const html=home||/\.html?$/i.test(file)
  const kind=html?'lecture-pages':'lecture-assets'
  const pathname=home?'/':'/'+rel
  let body=fs.readFileSync(file,'utf8')
  if(html){
    body=replaceCardEmojis(stripLegacyAnalytics(body))
    if(home){
      const match=/<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(body)
      if(!match)throw new Error('Homepage body missing')
      body=match[1]
    }
  }
  const query=new URLSearchParams({'where[path][equals]':pathname,limit:'1',depth:'0'})
  const already=await api('/api/'+kind+'?'+query.toString())
  if(already.docs?.length){skipped++;continue}
  const item=html
    ? {title:home?'Homepage':rel,path:pathname,status:'published',html:body}
    : {path:pathname,status:'published',source:body}
  await api('/api/'+kind,{method:'POST',body:JSON.stringify(item)})
  created++
}
console.log(JSON.stringify({created,skipped,total:sources.length},null,2))
