(() => {
 'use strict';
 const $=id=>document.getElementById(id),fmt=n=>new Intl.NumberFormat('ko-KR').format(Number(n)||0);
 let page=0,total=0,loading=false;
 const stateNames={new:'답변 필요',progress:'처리 중',done:'완료'};
 const categoryNames={product:'제품·사용법',order:'주문·배송',return:'교환·반품',other:'제휴·기타'};
 function loginView(){ $('login-panel').hidden=false;$('dashboard').hidden=true;$('logout').hidden=true;$('inquiries').replaceChildren() }
 async function api(path,options={}){
  const response=await fetch('/api/admin/'+path,{...options,credentials:'same-origin',headers:{'Content-Type':'application/json',...options.headers}});
  let data;try{data=await response.json()}catch{throw Error('서버에 연결할 수 없습니다. Cloudflare 배포와 설정을 확인해 주세요.')}
  if(!response.ok){if(response.status===401)loginView();throw Error(data.error||'요청을 처리하지 못했습니다.')}
  return data;
 }
 function element(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n}
 function dataRows(id,rows){const box=$(id);box.replaceChildren();if(!rows.length){box.append(element('p','아직 집계된 데이터가 없습니다.','small'));return}for(const [label,value]of rows){const row=element('div',undefined,'data-row');row.append(element('span',label),element('b',fmt(value)));box.append(row)}}
 const pageNames={'/':'홈','/index.html':'홈','/about':'제품 이야기','/about.html':'제품 이야기','/usage-guide':'사용 가이드','/usage-guide.html':'사용 가이드','/safety':'사용 전 확인','/safety.html':'사용 전 확인','/faq':'자주 묻는 질문','/faq.html':'자주 묻는 질문','/dog-chewing':'물어뜯기 이해하기','/dog-chewing.html':'물어뜯기 이해하기','/dog-personality-test':'성격·물어뜯기 성향 체크','/dog-personality-test.html':'성격·물어뜯기 성향 체크','/contact':'고객 문의','/contact.html':'고객 문의'};
 const pageLabel=path=>pageNames[path]||path;
 async function stats(){
  const data=await api('stats');$('login-panel').hidden=true;$('dashboard').hidden=false;$('logout').hidden=false;
  $('summary-date').textContent=data.day+' 기준 · 데이터 수집 시작 '+(data.started||'아직 기록 없음');
  $('today').textContent=fmt(data.visitors.today);$('pending').textContent=fmt(data.inquiries.pending);$('inquiry-total').textContent='보관 중인 전체 문의 '+fmt(data.inquiries.total)+'건';
  const counts=new Map(data.daily.map(r=>[r.day,r.visitors]));const dates=[];
  for(let i=29;i>=0;i--){const d=new Date(Date.parse(data.day+'T00:00:00Z')-i*86400000).toISOString().slice(0,10);dates.push([d,counts.get(d)||0])}
  const thirtyTotal=dates.reduce((n,r)=>n+r[1],0),recentSeven=dates.slice(-8,-1),sevenAverage=recentSeven.reduce((n,r)=>n+r[1],0)/7,top=data.pages[0];
  $('thirty-days').textContent=fmt(thirtyTotal);$('top-page').textContent=top?pageLabel(top.path):'아직 없음';$('top-page-views').textContent=top?'최근 30일 '+fmt(top.views)+'회 조회':'페이지 조회 데이터가 없습니다.';
  const insights=$('ops-insights');insights.replaceChildren();
  const visitMessage=sevenAverage?`오늘 방문은 최근 7일 평균 ${sevenAverage.toFixed(1)}명과 비교해 ${Number(data.visitors.today)>=sevenAverage?'좋은 흐름이에요.':'차분한 편이에요.'}`:'방문 데이터가 쌓이면 최근 평균과 오늘을 비교해 드립니다.';
  const inquiryMessage=Number(data.inquiries.pending)>0?`답변이 필요한 문의가 ${fmt(data.inquiries.pending)}건 있어요. 고객 문의함에서 먼저 확인해 주세요.`:'새로 답변할 문의가 없습니다.';
  const contentMessage=top?`최근 가장 관심을 받은 곳은 ‘${pageLabel(top.path)}’입니다. 관련 콘텐츠와 홍보 링크를 우선 활용해 보세요.`:'페이지 조회가 쌓이면 관심도가 높은 콘텐츠를 알려드립니다.';
  for(const [title,message]of [['방문 흐름',visitMessage],['콘텐츠 관심도',contentMessage],['문의 응대',inquiryMessage]]){const card=element('article',undefined,'ops-card');card.append(element('strong',title),element('p',message));insights.append(card)}
  const max=Math.max(1,...dates.map(d=>d[1]));$('chart').replaceChildren();$('daily-table').replaceChildren();
  $('chart').setAttribute('aria-label','최근 30일 방문 합계 '+fmt(thirtyTotal)+'회. 날짜별 수치는 아래 표에서 확인할 수 있습니다.');
  for(const [day,n]of dates){const b=element('div',undefined,'bar');b.style.height=(n/max*100)+'%';b.title=day+': '+fmt(n);$('chart').append(b);const tr=element('tr');tr.append(element('td',day),element('td',fmt(n)));$('daily-table').append(tr)}
  dataRows('top-pages',data.pages.map(r=>[pageLabel(r.path),r.views]));dataRows('languages',data.languages.map(r=>[({ko:'한국어',en:'English',ja:'日本語','zh-CN':'简体中文',vi:'Tiếng Việt'})[r.language]||r.language,r.views]));
 }
 async function inbox(){
  const result=await api('inquiries?status='+encodeURIComponent($('filter').value)+'&page='+page);total=result.total;$('inquiries').replaceChildren();
  if(!result.items.length)$('inquiries').append(element('p','이 상태의 문의가 없습니다.','small'));
  for(const item of result.items){
   const card=element('details',undefined,'inquiry'),summary=element('summary'),badge=element('span',stateNames[item.status],'badge '+item.status);
   summary.append(badge,document.createTextNode(item.subject));card.append(summary);
   card.append(element('p',`${item.name} · ${item.email} · ${categoryNames[item.category]} · ${item.language}`,'meta'));
   card.append(element('p',new Date(item.created_at*1000).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})+' KST · 접수번호 '+item.id,'meta'));
   card.append(element('div',item.message,'message'));
   const label=element('label','처리 상태'),select=element('select');for(const [v,t]of Object.entries(stateNames)){const option=element('option',t);option.value=v;select.append(option)}select.value=item.status;label.append(select);card.append(label);
   const noteLabel=element('label','내부 메모 (고객에게 전송되지 않음)'),note=element('textarea');note.rows=3;note.maxLength=4000;note.value=item.note;noteLabel.append(note);card.append(noteLabel);
   const actions=element('div',undefined,'inquiry-actions'),save=element('button','상태·메모 저장','primary'),reply=element('a','이메일로 답장 ↗'),remove=element('button','문의 삭제','danger'),feedback=element('p',undefined,'small');feedback.setAttribute('role','status');
   reply.href='mailto:'+encodeURIComponent(item.email)+'?subject='+encodeURIComponent('[BitterCare 답변] '+item.subject);reply.title='메일 앱에서 답장을 작성하고 직접 발송합니다.';
   save.onclick=async()=>{save.disabled=true;try{await api('inquiries/'+item.id,{method:'PATCH',body:JSON.stringify({status:select.value,note:note.value})});badge.textContent=stateNames[select.value];badge.className='badge '+select.value;feedback.textContent='저장했습니다. 이메일은 발송되지 않았습니다.';await stats()}catch(e){feedback.textContent=e.message}finally{save.disabled=false}};
   remove.onclick=async()=>{if(!confirm('이 문의와 내부 메모를 영구 삭제할까요? 되돌릴 수 없습니다.'))return;remove.disabled=true;try{await api('inquiries/'+item.id,{method:'DELETE'});if(page>0&&result.items.length===1)page--;await refresh()}catch(e){feedback.textContent=e.message;remove.disabled=false}};
   actions.append(save,reply,remove);card.append(actions,feedback);$('inquiries').append(card);
  }
  $('page-info').textContent=`${page+1} / ${Math.max(1,Math.ceil(total/20))} · ${fmt(total)}건`;$('previous').disabled=page===0;$('next').disabled=(page+1)*20>=total;
 }
 async function refresh(){if(loading)return;loading=true;$('refresh').disabled=true;$('admin-status').textContent='';try{await stats();await inbox()}catch(e){$('admin-status').textContent=e.message;if($('dashboard').hidden)$('login-status').textContent=e.message}finally{loading=false;$('refresh').disabled=false}}
 $('login-form').onsubmit=async event=>{event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;$('login-status').textContent='';try{await api('login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(event.target)))});event.target.reset();page=0;await refresh()}catch(e){$('login-status').textContent=e.message}finally{button.disabled=false}};
 $('logout').onclick=async()=>{try{await api('logout',{method:'POST',body:'{}'});loginView()}catch(e){$('admin-status').textContent=e.message}};
 $('refresh').onclick=refresh;$('filter').onchange=()=>{page=0;refresh()};$('previous').onclick=()=>{if(page>0){page--;refresh()}};$('next').onclick=()=>{if((page+1)*20<total){page++;refresh()}};
 refresh();
})();
