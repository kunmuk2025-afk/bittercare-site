const contactWords={"ko": {"pending": "접수 중…", "success": "문의가 접수되었습니다. 접수번호를 보관해 주세요:", "error": "접수하지 못했습니다. 잠시 후 다시 시도하거나 아래 이메일로 연락해 주세요.", "limit": "잠시 후 다시 시도해 주세요. 반복 접수는 제한됩니다.", "send": "문의 접수하기"}, "en": {"pending": "Submitting…", "success": "Your inquiry has been received. Please keep this reference:", "error": "We could not submit your inquiry. Try again later or contact us by email below.", "limit": "Please try again later. Repeated submissions are limited.", "send": "Submit inquiry"}, "ja": {"pending": "送信中…", "success": "受け付けました。受付番号をお控えください：", "error": "送信できませんでした。時間をおいて再度お試しいただくか、下記メールへご連絡ください。", "limit": "時間をおいて再度お試しください。連続送信は制限されています。", "send": "送信する"}, "zh-CN": {"pending": "正在提交…", "success": "咨询已收到，请保存编号：", "error": "提交失败，请稍后重试或通过下方邮箱联系我们。", "limit": "请稍后再试，重复提交受到限制。", "send": "提交咨询"}, "vi": {"pending": "Đang gửi…", "success": "Đã nhận yêu cầu. Vui lòng lưu mã này:", "error": "Chưa gửi được yêu cầu. Hãy thử lại sau hoặc liên hệ qua email bên dưới.", "limit": "Vui lòng thử lại sau. Số lần gửi liên tục bị giới hạn.", "send": "Gửi yêu cầu"}};
(() => {
 'use strict';
 const lang=document.documentElement.lang || 'ko';
 // One browser identifier per origin; stored client-side, no IP retained in analytics.
 if(/^https?:$/.test(location.protocol) && typeof crypto.randomUUID==='function'){
  let session;
  try{session=localStorage.getItem('bittercare-visitor-v14');if(!session){session=crypto.randomUUID();localStorage.setItem('bittercare-visitor-v14',session)}}catch{session=crypto.randomUUID()}
  fetch('/api/visitors',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session,path:location.pathname,language:lang}),credentials:'same-origin'}).catch(()=>{});
 }
 const form=document.getElementById('contact-form');if(!form)return;
 const words=contactWords[lang]||contactWords.en;
 const button=form.querySelector('[type=submit]'),status=document.getElementById('contact-status');
 let pending=false,requestId=crypto.randomUUID(),lastPayload='';
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(pending||!form.reportValidity())return;
  const data=Object.fromEntries(new FormData(form));data.consent=form.elements.consent.checked;data.language=lang;
  const signature=JSON.stringify(data);if(lastPayload&&lastPayload!==signature)requestId=crypto.randomUUID();lastPayload=signature;data.id=requestId;
  pending=true;button.disabled=true;button.textContent=words.pending;status.textContent='';status.className='';
  try{
   if(!/^https?:$/.test(location.protocol))throw Error('offline');
   const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),credentials:'same-origin'});
   if(!response.ok){if(response.status===429)throw Error('limit');throw Error('failed')}
   const result=await response.json();if(!result.id)throw Error('failed');
   status.textContent=words.success+'\n'+result.id;form.reset();requestId=crypto.randomUUID();lastPayload='';
  }catch(e){status.className='error';status.textContent=e.message==='limit'?words.limit:words.error}
  finally{pending=false;button.disabled=false;button.textContent=words.send}
 });
})();
