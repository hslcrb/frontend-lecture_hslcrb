import {useEffect,useRef,useState,type MouseEvent,type FormEvent} from 'react'
import parse from 'html-react-parser'

type Values=Record<number,string>
type Tabs=Record<string,string>
const number=(value:string|undefined,fallback:number)=>Number.isFinite(Number(value))?Number(value):fallback

/**
 * React event/state adapter for the original Grid/Flex/Position/Tailwind demos.
 *
 * The lesson content itself is a D1 document parsed into React nodes. Source
 * HTML scripts are never executed or deployed. This component translates
 * native inputs into React state and reflects their declarative values onto
 * the existing demonstration targets, preserving the original DOM/classes.
 */
export default function OriginalDemos({html,sourcePath}:{html:string;sourcePath:string}){
  const ref=useRef<HTMLDivElement>(null)
  const [ranges,setRanges]=useState<Values>({})
  const [selects,setSelects]=useState<Values>({})
  const [tabs,setTabs]=useState<Tabs>({})
  const [sidebarOpen,setSidebarOpen]=useState(false)
  const [autoItems,setAutoItems]=useState(3)
  const key=sourcePath.split('/')[1]??''
  function valueAt(i:number,fallback:number):number{return number(ranges[i],fallback)}
  function onInput(event:FormEvent<HTMLDivElement>){
    const el=event.target
    if(!(el instanceof HTMLInputElement)||el.type!=='range')return
    const index=Array.from(ref.current?.querySelectorAll('input[type=range]')??[]).indexOf(el)
    if(index>=0)setRanges(old=>({...old,[index]:el.value}))
  }
  function onChange(event:FormEvent<HTMLDivElement>){
    const el=event.target
    if(!(el instanceof HTMLSelectElement))return
    const index=Array.from(ref.current?.querySelectorAll('select')??[]).indexOf(el)
    if(index>=0)setSelects(old=>({...old,[index]:el.value}))
  }
  function onClick(event:MouseEvent<HTMLDivElement>){
    if(!(event.target instanceof Element))return
    const element=event.target
    if(element.closest('#menu-btn')){
      setSidebarOpen(old=>!old);return
    }
    if(element.closest('.sidebar-toggle')||element.closest('#overlay')||
       (element.closest('.nav-item')&&window.innerWidth<=768)){
      setSidebarOpen(false);return
    }
    const button=element.closest('button.tab-btn')
    if(!button)return
    const section=button.closest<HTMLElement>('.section')?.id??''
    const siblings=Array.from(button.parentElement?.querySelectorAll('button.tab-btn')??[])
    const index=siblings.indexOf(button)
    const label=button.textContent?.trim()??''
    if(key==='grid'&&section==='s4'){
      setAutoItems(n=>Math.max(1,Math.min(8,n+(label==='+'?1:-1))))
      return
    }
    setTabs(old=>({...old,[section]:String(index)}))
  }
  useEffect(()=>{
    const root=ref.current
    if(!root)return
    const q=<T extends HTMLElement>(id:string)=>root.querySelector<T>('#'+id)
    const style=(id:string,property:string,value:string)=>{
      const node=q<HTMLElement>(id)
      if(node)node.style.setProperty(property,value)
    }
    const text=(id:string,value:string)=>{
      const node=q<HTMLElement>(id)
      if(node)node.textContent=value
    }
    const items=Array.from(root.querySelectorAll<HTMLInputElement>('input[type=range]'))
    items.forEach((el,i)=>{
      const current=ranges[i]
      if(current===undefined)return
      el.value=current
      const row=el.closest('.ctrl-group')
      const label=row?.querySelector<HTMLElement>('.ctrl-val')
      if(label){
        const previous=label.textContent?.trim()??''
        label.textContent=current+(/px$/.test(previous)?'px':/%$/.test(previous)?'%':'')
      }
    })
    const selectsNodes=Array.from(root.querySelectorAll<HTMLSelectElement>('select'))
    selectsNodes.forEach((el,i)=>{if(selects[i]!==undefined)el.value=selects[i]})
    root.querySelector('#sidebar')?.classList.toggle('open',sidebarOpen)
    root.querySelector('#overlay')?.classList.toggle('show',sidebarOpen)
    const menu=q<HTMLElement>('menu-btn')
    if(menu)menu.textContent=sidebarOpen?'✕':'☰'
    for(const [section,idx] of Object.entries(tabs)){
      const buttons=Array.from(root.querySelectorAll<HTMLButtonElement>('#'+section+' button.tab-btn'))
      buttons.forEach((button,i)=>button.classList.toggle('active',i===Number(idx)))
    }
    if(key==='grid'){
      const repeat=valueAt(0,3),min=valueAt(1,80),width=valueAt(2,100)
      style('p2-grid','grid-template-columns','repeat('+repeat+',1fr)')
      text('r2-n',String(repeat));text('v-repeat',String(repeat))
      style('p3-grid','grid-template-columns','repeat(3,minmax('+min+'px,1fr))')
      style('p3-wrap','width',width+'%')
      text('mm-min-v',String(min));text('v-mm',min+'px');text('p3-label','min: '+min+'px')
      text('v-wrap',width+'%');text('p3-wrap-w',width+'%')
      const wrap=q<HTMLElement>('p3-wrap'),desc=q<HTMLElement>('p3-desc')
      if(wrap&&desc){
        const px=wrap.offsetWidth,per=Math.floor(px/3)
        desc.textContent='컨테이너 '+width+'% (약 '+px+'px) — 칸당 '+per+
          'px '+(min>per?'< min '+min+'px → 최솟값 발동! 가로 스크롤 발생':
            '≥ min '+min+'px → 1fr 균등 분배')
      }
      const keys=['cs','ce','rs','re']
      const defaults=[1,3,1,3]
      const spans:Record<string,number>={}
      keys.forEach((name,i)=>{
        const val=valueAt(3+i,defaults[i])
        spans[name]=val
        text('v-'+name,String(val));text(name+'-v',String(val))
      })
      style('p5-item','grid-column',spans.cs+'/'+spans.ce)
      style('p5-item','grid-row',spans.rs+'/'+spans.re)
      const rowGap=valueAt(7,16),colGap=valueAt(8,16)
      style('p8-grid','row-gap',rowGap+'px');style('p8-grid','column-gap',colGap+'px')
      text('v-rowgap',rowGap+'px');text('v-colgap',colGap+'px')
      text('v-af',String(autoItems))
      ;['p4-fill','p4-fit'].forEach((id,index)=>{
        const el=q<HTMLElement>(id)
        if(!el||el.dataset.reactItems===String(autoItems))return
        el.dataset.reactItems=String(autoItems)
        el.replaceChildren(...Array.from({length:autoItems},(_,i)=>{
          const div=document.createElement('div')
          div.className='pi'+(index===1?' green':'')
          div.style.minHeight='36px';div.style.fontSize='11px'
          div.textContent=String.fromCharCode(65+i)
          return div
        }))
      })
      const preset=number(tabs.s6,0)
      const area=[
        {cols:'repeat(4,1fr)',area:"'. . . a' '. . b c' '. d e f' 'g h i .'"},
        {cols:'repeat(2,1fr)',area:"'a b' 'c d' 'e f' 'g h' 'i .'"},
        {cols:'1fr',area:"'a' 'b' 'c' 'd' 'e' 'f' 'g' 'h' 'i'"}
      ][preset]??null
      if(area){style('p6-grid','grid-template-columns',area.cols);style('p6-grid','grid-template-areas',area.area)}
    }
    if(key==='flex'){
      const gap=valueAt(0,16)
      style('p5-box','gap',gap+'px');text('v-gap',gap+'px')
      const grow=[1,2,3].map((i)=>valueAt(i,1))
      grow.forEach((val,i)=>{
        const name='g'+(i+1)
        style(name,'flex-grow',String(val))
        text(name+'v',String(val));text(name+'-v',String(val))
      })
      text('grow-desc',grow.every(x=>x===0)?
        '모두 grow:0 → 내용 크기만큼만 차지, 남은 공간은 빈 채로':
        'A:B:C = '+grow.join(':')+' → 남은 공간을 이 비율로 나눠 가져요')
      const shrinkWidth=valueAt(4,100)
      style('p6-shrink-wrap','width',shrinkWidth+'%')
      text('v-shrink-wrap',shrinkWidth+'%')
      ;[5,6,7].forEach((i,j)=>{
        const val=valueAt(i,j===2?0:1),name='s'+(j+1)
        style(name+'-item','flex-shrink',String(val))
        text(name+'v',String(val));text(name+'-v',String(val))
      })
      const flexBox=q<HTMLElement>('p8-box')
      const wrap=number(tabs.s8,0)===1?'wrap':'nowrap'
      if(flexBox)flexBox.style.flexWrap=wrap
      style('p8-wrap','width',valueAt(8,100)+'%')
      text('v-wrap8',valueAt(8,100)+'%')
      const ac=q<HTMLSelectElement>('ac-sel')
      if(ac)ac.disabled=wrap!=='wrap'
      const s1=number(tabs.s1,1)===1
      style('p1-box','display',s1?'flex':'block')
      style('p1-box','gap',s1?'8px':'0')
      style('p1-m','margin-top',s1?'0':'4px')
      style('p1-m2','margin-top',s1?'0':'4px')
      const basis=[{val:'auto',desc:'auto: 각 아이템이 내용 크기만큼 공간을 차지해요 (Hug 모드)'},
        {val:'100px',desc:'basis: 100px → 모든 아이템이 100px부터 시작, 남은 공간은 grow로'},
        {val:'200px',desc:'basis: 200px → 모든 아이템이 200px부터 시작해요'},
        {val:'0',desc:'basis: 0 → 기본 크기 무시, grow 비율로만 크기 결정 (flex:1과 같음)'}][number(tabs.s6,0)]
      if(basis){
        ;['b1','b2','b3'].forEach(id=>{
          style(id,'flex-basis',basis.val)
          style(id,'flex-grow',basis.val==='0'?'1':'0')
        })
        text('basis-desc',basis.desc)
      }
      if(selects[0])style('p2-box','flex-direction',selects[0])
      if(selects[1])style('p3-box','justify-content',selects[1])
      if(selects[2])style('p4-box','align-items',selects[2])
      if(selects[3]){style('as-item','align-self',selects[3]);text('as-label',selects[3])}
      if(wrap==='wrap'&&selects[4])style('p8-box','align-content',selects[4])
    }
    if(key==='position'){
      const top=valueAt(0,0),left=valueAt(1,0),
        absTop=valueAt(2,12),absRight=valueAt(3,12),z=valueAt(4,1)
      style('r-box','top',top+'px');style('r-box','left',left+'px')
      text('v-rtop',top+'px');text('v-rleft',left+'px')
      style('abs-badge','top',absTop+'px');style('abs-badge','right',absRight+'px')
      text('abs-top-v',absTop+'px');text('abs-right-v',absRight+'px')
      text('v-atop',absTop+'px');text('v-aright',absRight+'px')
      style('z-blue','z-index',String(z));text('v-z',String(z));text('z-blue-label','z-index: '+z)
      const positions=['static','relative','absolute','fixed']
      const mode=positions[number(tabs.s1,0)]??'static'
      style('p1-box','position',mode)
      style('p1-box','top',mode==='fixed'||mode==='absolute'?'10px':'0')
      style('p1-box','right',mode==='fixed'||mode==='absolute'?'10px':'auto')
      const descriptions:Record<string,string>={
        static:'static: 기본값 — 위치 이동 불가, 문서 흐름대로 배치',
        relative:'relative: 본래 위치 기준으로 이동 — 빈 자리는 유지됨',
        absolute:'absolute: 문서 흐름 이탈 — relative 부모 기준으로 자유롭게 배치',
        fixed:'fixed: 뷰포트 고정 — 스크롤해도 항상 같은 자리 (이 데모에선 제한됨)'
      }
      text('p1-desc',descriptions[mode])
      const staticMode=number(tabs.s7,0)===1
      style('static-box','position',staticMode?'static':'absolute')
      style('static-box','width',staticMode?'100%':'40%')
      style('static-sibling','margin-left',staticMode?'0':'42%')
      style('static-sibling','margin-top',staticMode?'8px':'0')
      text('static-label',staticMode?'position: static (초기화)':'position: absolute')
    }
    if(key==='tailwind'){
      const justify=['flex-start','center','flex-end','space-between'][number(tabs.s4,0)]??'flex-start'
      const tw=['justify-start','justify-center','justify-end','justify-between'][number(tabs.s4,0)]
      style('flex-demo','justify-content',justify)
      text('flex-label','flex '+tw+' items-center gap-4')
      const cols=[2,3,4,5][number(tabs.s5,0)]??2
      style('grid-demo','grid-template-columns','repeat('+cols+',1fr)')
      text('grid-label','grid grid-cols-'+cols+' gap-2')
    }
  },[key,ranges,selects,tabs,sidebarOpen,autoItems,html])

  useEffect(()=>{
    const handler=()=>{
      const root=ref.current
      if(!root)return
      let current=''
      root.querySelectorAll<HTMLElement>('.section[id]').forEach(s=>{
        if(window.scrollY>=s.offsetTop-60)current=s.id
      })
      root.querySelectorAll<HTMLAnchorElement>('.nav-item').forEach(nav=>
        nav.classList.toggle('active',nav.getAttribute('href')==='#'+current))
    }
    window.addEventListener('scroll',handler,{passive:true})
    handler()
    return()=>window.removeEventListener('scroll',handler)
  },[html])

  return <div ref={ref} style={{display:'contents'}} onInputCapture={onInput}
    onChangeCapture={onChange} onClickCapture={onClick}>
    {parse(html)}
  </div>
}
