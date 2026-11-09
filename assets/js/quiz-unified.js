/* Unified quiz controller for HTML/CSS learning archive. */
(()=>{'use strict';
const cfg=window.QUIZ_CONFIG||{}, data=window.QUIZ_DATA;
const root=document.getElementById('quiz-root');
if(!root||!Array.isArray(data)||!data.length){if(root)root.textContent='문제 데이터를 불러오지 못했습니다.';return;}
const escapeHtml=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const rich=s=>cfg.subject==='HTML'?escapeHtml(s):String(s??'');
const arr=data.map(item=>({
 cat:item.cat||item.category||'',q:item.q||item.question||'',hint:item.hint||'',code:item.code||'',
 tree:item.tree||'',preview:item.preview||'',opts:item.opts||item.options||null,
 ans:item.ans!==undefined?item.ans:item.answer,ex:item.ex||item.explain||item.feedback||'',
 type:item.type==='short'?'short':'choice'
}));
let current=0,answers=new Array(arr.length).fill(null),showResult=false;
const answeredCount=()=>answers.filter(x=>x!==null).length;
const isCorrect=(q,a)=>q.type==='short'?String(a??'').trim().replace(/\s+/g,'').toLowerCase()===String(q.ans).trim().replace(/\s+/g,'').toLowerCase():a===q.ans;
function optionText(o){return typeof o==='object'&&o!==null?o.text:String(o)}
function render(){
 if(showResult){renderScore();return;}
 const q=arr[current],saved=answers[current],done=saved!==null,num=current+1;
 const correct=done?isCorrect(q,saved):false;
 root.innerHTML=`
 <div class="quiz-progress-row"><span>문제 <strong>${num} / ${arr.length}</strong></span><span>${answeredCount()} / ${arr.length} 완료</span></div>
 <div class="quiz-progress-track" role="progressbar" aria-label="학습 진행" aria-valuenow="${answeredCount()}" aria-valuemin="0" aria-valuemax="${arr.length}"><div class="quiz-progress-fill" style="width:${Math.round(answeredCount()/arr.length*100)}%"></div></div>
 <div class="quiz-meta"><span class="quiz-number">${num} / ${arr.length}</span>${q.cat?`<span class="quiz-category">${escapeHtml(q.cat)}</span>`:''}</div>
 <h2 class="quiz-question">${rich(q.q)}</h2>
 ${q.hint?`<div class="quiz-hint"><strong>힌트</strong> — ${escapeHtml(q.hint)}</div>`:''}
 ${q.tree?`<pre class="quiz-tree">${escapeHtml(q.tree)}</pre>`:''}
 ${q.code?`<pre class="quiz-sample"><code>${escapeHtml(q.code)}</code></pre>`:''}
 ${q.preview?`<div class="quiz-preview">${q.preview}</div>`:''}
 <div id="quiz-options" class="quiz-options"></div>
 ${done?`<div class="quiz-feedback ${correct?'is-correct':'is-wrong'}" role="status"><h3>${correct?'정답입니다.':'오답입니다.'}</h3>${!correct?`<p><strong>정답: ${q.type==='short'?escapeHtml(q.ans):escapeHtml(optionText(q.opts[q.ans]))}</strong></p>`:''}<p>${rich(q.ex)}</p></div>`:''}
 <div class="quiz-navigation"><button type="button" class="quiz-btn" id="quiz-prev" ${current===0?'disabled':''}>← 이전</button><span class="quiz-navigation-note">${answeredCount()}문제 완료</span><button type="button" class="quiz-btn primary" id="quiz-next">${current===arr.length-1?'결과 보기':'다음 →'}</button></div>`;
 const options=document.getElementById('quiz-options');
 if(q.type==='short'){
  const input=document.createElement('input');input.className='quiz-input';input.type='text';input.placeholder='정답을 입력하세요';input.setAttribute('aria-label','단답형 정답');input.disabled=done;
  if(done)input.value=saved;options.append(input);
  if(!done){const b=document.createElement('button');b.className='quiz-btn primary quiz-input-submit';b.type='button';b.textContent='정답 확인';b.addEventListener('click',()=>{if(!input.value.trim())return;answers[current]=input.value;render()});input.addEventListener('keydown',e=>{if(e.key==='Enter')b.click()});options.append(b)}
 }else{
  (q.opts||[]).forEach((option,i)=>{const b=document.createElement('button');b.type='button';b.className='quiz-choice';b.disabled=done;
   if(done&&i===q.ans)b.classList.add('is-correct');
   if(done&&i===saved&&!correct)b.classList.add('is-wrong');
   const marker=document.createElement('span');marker.className='quiz-choice-letter';marker.textContent=String.fromCharCode(65+i);
   const label=document.createElement('span');label.textContent=optionText(option);b.append(marker,label);if(option&&typeof option==='object'&&option.color){const swatch=document.createElement('span');swatch.setAttribute('aria-hidden','true');swatch.style.cssText='display:inline-block;flex-shrink:0;width:16px;height:16px;border-radius:4px;border:1px solid #cbd5e1;margin-left:auto';swatch.style.backgroundColor=option.color;b.append(swatch);}
   if(!done)b.addEventListener('click',()=>{answers[current]=i;render()});options.append(b)})
 }
 document.getElementById('quiz-prev').addEventListener('click',()=>{current=Math.max(0,current-1);render()});
 document.getElementById('quiz-next').addEventListener('click',()=>{if(current===arr.length-1){showResult=true}else{current++}render()});
}
function renderScore(){
 const correct=arr.filter((q,i)=>answers[i]!==null&&isCorrect(q,answers[i])).length,wrong=answeredCount()-correct,skip=arr.length-answeredCount();
 const pct=Math.round(correct/arr.length*100);
 const message=pct>=90?'핵심 개념을 정확하게 이해했어요.':pct>=70?'잘했어요. 오답을 다시 확인해 보세요.':pct>=50?'핵심 개념을 복습하면 더 좋아질 거예요.':'이론을 다시 읽고 도전해 보세요.';
 root.innerHTML=`<div class="quiz-score"><h2>퀴즈 결과</h2><div class="quiz-score-number">${pct}점</div><p class="quiz-score-message">${message}</p><div class="quiz-score-stats"><div class="quiz-score-stat"><strong>${correct}</strong><span>정답</span></div><div class="quiz-score-stat"><strong>${wrong}</strong><span>오답</span></div><div class="quiz-score-stat"><strong>${skip}</strong><span>미응답</span></div></div><h3>문제 다시 보기</h3><div id="quiz-revisit" class="quiz-revisit"></div><button type="button" class="quiz-btn primary" id="quiz-restart">처음부터 다시 풀기</button></div>`;
 const review=document.getElementById('quiz-revisit');
 arr.forEach((q,i)=>{const b=document.createElement('button');b.type='button';b.className='quiz-btn';b.textContent=`${i+1}번 ${answers[i]===null?'미응답':isCorrect(q,answers[i])?'정답':'오답'}`;b.addEventListener('click',()=>{current=i;showResult=false;render()});review.append(b)});
 document.getElementById('quiz-restart').addEventListener('click',()=>{current=0;answers=new Array(arr.length).fill(null);showResult=false;render()});
}
render();
})();
