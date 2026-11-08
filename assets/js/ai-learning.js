/* AI theory view: trusted static teaching text, no HTML string injection. */
(()=>{
 const lessons=window.AI_LESSONS||[];
 const root=document.getElementById('ai-lessons');
 if(!root)return;
 const step=Number(root.dataset.step||0);
 const link=(href,label,extraClass='')=>{const a=document.createElement('a');a.href=href;a.textContent=label;a.className='ai-link '+extraClass;return a;};
 const txt=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=value;return e;};
 const nav=(current)=>{const nav=document.createElement('nav');nav.className='ai-tabs';nav.setAttribute('aria-label','AI 학습 단계 이동');[['index.html','AI 전체 목차',0],...lessons.map(x=>['step-'+String(x.id).padStart(2,'0')+'.html',String(x.id)+'단계',x.id])].forEach(([href,name,id])=>{const a=document.createElement('a');a.href=href;a.textContent=name;if(current===id)a.setAttribute('aria-current','page');nav.append(a)});return nav;};
 const createHeader=(title,subtitle,eyebrow,current)=>{const h=document.createElement('header');h.className='ai-header';const home=document.createElement('a');home.href='../index.html';home.className='ai-home';home.textContent='Frontend Lab · 강의 홈';h.append(home,txt('span','ai-kicker',eyebrow),txt('h1','',title),txt('p','',subtitle),nav(current));return h;};
 const footer=(current)=>{const sec=document.createElement('nav');sec.className='ai-bottom';sec.setAttribute('aria-label','다른 AI 학습 페이지');sec.append(txt('h2','','다른 학습 페이지로 이동'));const links=document.createElement('div');links.className='ai-bottom-links';if(current){if(current>1)links.append(link('step-'+String(current-1).padStart(2,'0')+'.html','← 이전 단계'));links.append(link('quiz-'+String(current).padStart(2,'0')+'.html',current+'단계 문제 풀기','primary'));if(current<lessons.length)links.append(link('step-'+String(current+1).padStart(2,'0')+'.html','다음 단계 →'));}if(current===lessons.length){const guide=link('https://github.com/JJinMangGo/JJinMangGo/tree/main/ai-system-design-easy','심화 읽기 · AI 시스템 설계 20편 →');guide.target='_blank';guide.rel='noopener noreferrer';links.append(guide)}
 links.append(link('index.html','AI 전체 목차'));links.append(link('../index.html','Frontend Lab 홈'));sec.append(links);return sec;};
 if(!step){
 root.append(createHeader('AI 기초부터 에이전트까지','어려운 AI 용어를 쉬운 비유와 실무 사례로 배우는 6단계 학습 과정','AI LEARNING · 6 STEPS',0));
 const grid=document.createElement('div');grid.className='ai-grid';
 for(const lesson of lessons){const card=document.createElement('article');card.className='ai-step-card';card.append(txt('div','ai-k','STEP '+String(lesson.id).padStart(2,'0')),txt('h2','',lesson.title),txt('p','desc',lesson.subtitle),txt('p','terms',lesson.terms));const acts=document.createElement('div');acts.className='ai-actions';acts.append(link('step-'+String(lesson.id).padStart(2,'0')+'.html','이론 학습','primary'),link('quiz-'+String(lesson.id).padStart(2,'0')+'.html','10문제 풀기'));card.append(acts);grid.append(card)}root.append(grid);
 const advanced=document.createElement('section');advanced.className='ai-summary ai-advanced';advanced.append(
  txt('div','ai-k','NEXT STEP · 심화 읽기'),
  txt('h2','','AI 시스템 설계, 실제 서비스까지 이해하기'),
  txt('p','','6단계 이론과 퀴즈를 마쳤다면, 토큰·RAG·에이전트·MCP부터 AI UX·평가·배포까지 연결하는 한국어 해설 20편을 읽어보세요.')
 );
 const advancedLinks=document.createElement('div');advancedLinks.className='ai-actions';
 const advancedLink=link('https://github.com/JJinMangGo/JJinMangGo/tree/main/ai-system-design-easy','AI 시스템 설계 해설 20편 읽기 →','primary');
 advancedLink.target='_blank';advancedLink.rel='noopener noreferrer';
 advancedLinks.append(advancedLink);advanced.append(advancedLinks);
 root.append(advanced,footer(0));
 }else{
 const lesson=lessons.find(x=>x.id===step);if(!lesson){root.append(txt('p','','학습 단계를 찾을 수 없습니다.'));return}
 root.append(createHeader(lesson.title,lesson.subtitle,'AI LEARNING · STEP '+String(step).padStart(2,'0'),step));
 const summary=document.createElement('section');summary.className='ai-summary';summary.append(txt('h2','','이번 시간에 배울 것'),txt('p','',lesson.subtitle));const kws=document.createElement('div');kws.className='ai-keywords';lesson.terms.split(' · ').forEach(k=>kws.append(txt('span','',k)));summary.append(kws);root.append(summary);
 lesson.blocks.forEach((block,i)=>{const [heading,definition,analogy,example,point]=block;const card=document.createElement('section');card.className='ai-topic';card.append(txt('div','ai-k','PART '+String(i+1).padStart(2,'0')),txt('h2','',heading),txt('p','definition',definition));
 const analogyBox=document.createElement('div');analogyBox.className='ai-example';analogyBox.append(txt('strong','','쉽게 이해하기'),txt('p','',analogy));card.append(analogyBox);
 const caseBox=document.createElement('div');caseBox.className='ai-case';caseBox.append(txt('strong','','수업·실무 사례'),txt('p','',example));card.append(caseBox);
 const pointBox=document.createElement('div');pointBox.className='ai-point';pointBox.append(txt('strong','','핵심 기억하기'),txt('p','',point));card.append(pointBox);root.append(card)});
 root.append(footer(step))
 }
 root.append(txt('p','ai-footer','JJinMangGo · Frontend Lab AI Learning'));
})();
