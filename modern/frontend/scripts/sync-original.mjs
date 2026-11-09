import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const defaultOutput = path.resolve(dir,'../public')
const sourceDirs = ['ai','assets','flex','grid','javascript','position','quiz','tailwind','uiux']
export const iconNames = {
  '📐':'grid', '🧩':'puzzle', '🎨':'palette', '📏':'ruler',
  '📦':'box', '🔗':'link', '⚖️':'scale', '📝':'notes', '✍️':'pen',
  '🖼️':'image', '🎯':'target', '💻':'computer', '🧠':'brain',
  '🚀':'rocket', '📚':'book', '💡':'lightbulb', '🧪':'flask',
  '🔢':'numbers', '🎓':'graduation', '📱':'phone', '🖌️':'paintbrush',
  '📊':'chart', '🗂️':'folder', '📌':'pin', '🌊':'wave',
  '⚡':'bolt', '➕':'add', '❓':'question', '🔄':'refresh',
  '👁️':'eye', '📖':'open-book',
}
export function findSourceRoot() {
  let p = path.resolve(process.env.SOURCE_REPO_ROOT || path.join(dir,'../../..'))
  for(let i=0;i<6;i++){
    if (fs.existsSync(path.join(p,'DESIGN.md')) &&
        fs.existsSync(path.join(p,'index.html')) &&
        fs.existsSync(path.join(p,'assets/css/tokens.css'))) return p
    const next = path.dirname(p)
    if (next===p) break
    p=next
  }
  throw new Error('Cannot find latest upstream sources: DESIGN.md, index.html, assets/css/tokens.css')
}
export function replaceCardEmojis(html) {
  return html.replace(/(<span\b[^>]*class=["'][^"']*\bcard-icon\b[^"']*["'][^>]*>)([^<]*)(<\/span>)/giu,
    (whole,opening,inner,closing) => {
      const icon = iconNames[inner.trim()]
      if(!icon)return whole
      return opening+'<img class="custom-card-icon" src="/ui/icons/'+icon+'.svg" alt="" aria-hidden="true">'+closing
    })
}
export function stripLegacyAnalytics(html) {
  return html.replace(/<script\b[^>]*src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js[^"']*["'][^>]*><\/script>\s*/giu,'')
    .replace(/<script>\s*window\.dataLayer\s*=\s*window\.dataLayer[\s\S]*?gtag\('config',[\s\S]*?<\/script>\s*/giu,'')
}
function updateCopiedHtml(dir) {
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const file = path.join(dir,e.name)
    if(e.isDirectory())updateCopiedHtml(file)
    else if(e.isFile() && /\.html?$/i.test(file)){
      const html = fs.readFileSync(file,'utf8')
      fs.writeFileSync(file,replaceCardEmojis(stripLegacyAnalytics(html)),'utf8')
    }
  }
}
function manifestEntries(root) {
  const items = [{path:'/',kind:'html',title:'Frontend Lab · 메인'}]
  for(const folder of sourceDirs){
    const top=path.join(root,folder)
    if(!fs.existsSync(top))continue
    const stack=[top]
    while(stack.length){
      const current=stack.pop()
      for(const entry of fs.readdirSync(current,{withFileTypes:true})){
        const file=path.join(current,entry.name)
        if(entry.isDirectory()){stack.push(file);continue}
        const ext=path.extname(file).toLowerCase()
        if(!['.html','.htm','.js','.css'].includes(ext))continue
        const relative=path.relative(root,file).split(path.sep).join('/')
        let title=relative
        if(ext==='.html'||ext==='.htm'){
          const s=fs.readFileSync(file,'utf8')
          const m=/<title[^>]*>([\s\S]*?)<\/title>/i.exec(s)
          if(m)title=m[1].replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').trim().slice(0,120)||relative
        }
        items.push({path:'/'+relative,kind:ext==='.css'?'css':ext==='.js'?'js':'html',title})
      }
    }
  }
  items.sort((a,b)=>a.path.localeCompare(b.path,'ko'))
  return {items,generatedAt:new Date().toISOString()}
}
export function syncOriginal(root,output=defaultOutput) {
  if(!fs.existsSync(path.join(root,'DESIGN.md')))throw new Error('Invalid lecture repo')
  fs.mkdirSync(output,{recursive:true})
  for (const name of sourceDirs) {
    const source=path.join(root,name), target=path.join(output,name)
    if(!fs.existsSync(source))continue
    fs.rmSync(target,{recursive:true,force:true})
    fs.cpSync(source,target,{recursive:true,force:true})
    updateCopiedHtml(target)
  }
  if(fs.existsSync(path.join(root,'favicon.ico')))fs.copyFileSync(path.join(root,'favicon.ico'),path.join(output,'favicon.ico'))
  const html=stripLegacyAnalytics(fs.readFileSync(path.join(root,'index.html'),'utf8'))
  const match=/<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html)
  if(!match)throw new Error('Original homepage body missing')
  fs.writeFileSync(path.join(output,'original-home.html'),match[1],'utf8')
  fs.writeFileSync(path.join(output,'original-manifest.json'),JSON.stringify(manifestEntries(root),null,2),'utf8')
  return { copied:sourceDirs.filter(x=>fs.existsSync(path.join(root,x))),homeBytes:Buffer.byteLength(match[1]) }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(syncOriginal(findSourceRoot()),null,2))
}
