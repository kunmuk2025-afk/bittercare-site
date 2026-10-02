// BitterCare V15 — Cloudflare Pages advanced mode, no third-party dependencies.
const encoder=new TextEncoder();
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LANGS=['ko','en','ja','zh-CN','vi'];
const json=(value,status=200,extra={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow',...extra}});
const hex=buffer=>Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');
const hash=async text=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(text)));
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const dayAt=ms=>new Date(ms+32400000).toISOString().slice(0,10);
function equal(a,b){let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0}
async function readBody(request){
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw {status:415};
 if(Number(request.headers.get('Content-Length'))>24000)throw {status:413};
 const reader=request.body?.getReader();if(!reader)throw {status:400};let length=0,chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>24000){await reader.cancel();throw {status:413}}chunks.push(value)}
 const bytes=new Uint8Array(length);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}
 try{return JSON.parse(new TextDecoder().decode(bytes))}catch{throw {status:400}}
}
async function limit(db,request,kind,max,windowSeconds){
 const now=Math.floor(Date.now()/1000),bucket=Math.floor(now/windowSeconds);
 const key=await hash(kind+':'+bucket+':'+(request.headers.get('CF-Connecting-IP')||'local'));
 const row=await db.prepare('INSERT INTO rate_limits(key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,(bucket+1)*windowSeconds).first();
 if(row.count>max)throw {status:429};
}
async function cleanup(db){const now=Math.floor(Date.now()/1000);await db.batch([
 db.prepare('DELETE FROM rate_limits WHERE expires <= ?').bind(now),
 db.prepare('DELETE FROM admin_sessions WHERE expires <= ?').bind(now),
 db.prepare('DELETE FROM inquiries WHERE created_at < ?').bind(now-90*86400)
])}
async function authenticated(request,env){
 const token=(request.headers.get('Cookie')||'').match(/(?:^|;\s*)__Host-bcadmin=([a-f0-9]{64})(?:;|$)/)?.[1];
 if(!token||!env.ADMIN_PASSWORD_HASH)return null;
 const row=await env.VISITOR_DB.prepare('SELECT expires,credential_hash FROM admin_sessions WHERE token_hash=?').bind(await hash(token)).first();
 return row&&row.expires>Math.floor(Date.now()/1000)&&equal(row.credential_hash,await hash(env.ADMIN_PASSWORD_HASH+':'+env.ADMIN_USER))?token:null;
}
function cookie(token,age=28800){return `__Host-bcadmin=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`}
function field(body,key,min,max){const v=body[key];if(typeof v!=='string'||v.trim().length<min||v.length>max)throw {status:400};return v.trim()}
export default {async fetch(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/'))return env.ASSETS.fetch(request);
 try{
  if(!['GET','POST','PATCH','DELETE'].includes(request.method))return json({error:'Method not allowed'},405);
  if(request.method!=='GET'&&request.headers.get('Origin')!==url.origin)return json({error:'Forbidden'},403);
  if(!env.VISITOR_DB)return json({error:'Service not configured'},503);
  const db=env.VISITOR_DB,now=Math.floor(Date.now()/1000),today=dayAt(Date.now());
  if(path==='/api/visitors'&&request.method==='POST'){
   await limit(db,request,'visit',120,60);
   const b=await readBody(request);if(!UUID.test(b.session))return json({error:'Invalid visitor'},400);
   const page=typeof b.path==='string'?b.path:'/';
   if(!/^\/(?:en\/|ja\/|zh-CN\/|vi\/)?(?:(?:index|about|usage-guide|safety|faq|dog-chewing|contact|404)(?:\.html)?)?$/.test(page))return json({error:'Invalid page'},400);
   const language=LANGS.includes(b.language)?b.language:'ko';
   await db.batch([db.prepare('INSERT OR IGNORE INTO visits(day,session) VALUES (?,?)').bind(today,b.session),db.prepare('INSERT INTO page_stats(day,path,language,views) VALUES (?,?,?,1) ON CONFLICT(day,path,language) DO UPDATE SET views=views+1').bind(today,page,language),db.prepare('DELETE FROM rate_limits WHERE expires <= ?').bind(now)]);
   return json({ok:true}); // Totals are private and only available through admin endpoints.
  }
  if(path==='/api/contact'&&request.method==='POST'){
   await limit(db,request,'contact',5,3600);
   const b=await readBody(request);
   if(b.website||b.consent!==true||!UUID.test(b.id))return json({error:'Invalid form'},400);
   const name=field(b,'name',1,80),email=field(b,'email',3,254),subject=field(b,'subject',1,150),message=field(b,'message',10,4000);
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!['product','order','return','other'].includes(b.category)||!LANGS.includes(b.language))return json({error:'Invalid form'},400);
   await cleanup(db);
   await db.prepare('INSERT OR IGNORE INTO inquiries(id,created_at,name,email,category,subject,message,language,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(b.id,now,name,email,b.category,subject,message,b.language,now).run();
   return json({ok:true,id:b.id},201);
  }
  if(path==='/api/admin/login'&&request.method==='POST'){
   if(!env.ADMIN_USER||!/^([a-f0-9]{32}):([a-f0-9]{64})$/.test(env.ADMIN_PASSWORD_HASH||''))return json({error:'관리자 설정이 필요합니다. 설치 안내서를 확인해 주세요.'},503);
   await limit(db,request,'login',10,900);
   const b=await readBody(request);const username=field(b,'username',1,100),password=field(b,'password',1,256);
   const [salt,expected]=env.ADMIN_PASSWORD_HASH.split(':');
   const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
   const actual=hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256));
   const passwordOK=equal(actual,expected),userOK=equal(username,env.ADMIN_USER);
   if(!passwordOK||!userOK)return json({error:'아이디 또는 비밀번호를 확인해 주세요.'},401);
   await cleanup(db);const token=random();
   await db.prepare('INSERT INTO admin_sessions(token_hash,expires,credential_hash) VALUES (?,?,?)').bind(await hash(token),now+28800,await hash(env.ADMIN_PASSWORD_HASH+':'+env.ADMIN_USER)).run();
   return json({ok:true},200,{'Set-Cookie':cookie(token)});
  }
  if(path.startsWith('/api/admin/')){
   const token=await authenticated(request,env);if(!token)return json({error:'로그인이 필요합니다.'},401);
   if(path==='/api/admin/logout'&&request.method==='POST'){
    await db.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await hash(token)).run();return json({ok:true},200,{'Set-Cookie':cookie('',0)});
   }
   if(path==='/api/admin/stats'&&request.method==='GET'){
    await cleanup(db);const since=dayAt(Date.now()-29*86400000);
    const rows=await db.batch([
     db.prepare('SELECT COUNT(*) AS total,COUNT(DISTINCT session) AS uniqueVisitors,SUM(CASE WHEN day=? THEN 1 ELSE 0 END) AS today FROM visits').bind(today),
     db.prepare('SELECT day,COUNT(*) AS visitors FROM visits WHERE day>=? GROUP BY day ORDER BY day').bind(since),
     db.prepare("SELECT COUNT(*) AS total,SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) AS pending FROM inquiries"),
     db.prepare('SELECT path,SUM(views) AS views FROM page_stats WHERE day>=? GROUP BY path ORDER BY views DESC LIMIT 10').bind(since),
     db.prepare('SELECT language,SUM(views) AS views FROM page_stats WHERE day>=? GROUP BY language ORDER BY views DESC').bind(since),
     db.prepare('SELECT MIN(day) AS started FROM visits')
    ]);
    return json({version:'V14',day:today,visitors:rows[0].results[0],daily:rows[1].results,inquiries:rows[2].results[0],pages:rows[3].results,languages:rows[4].results,started:rows[5].results[0].started});
   }
   if(path==='/api/admin/inquiries'&&request.method==='GET'){
    await cleanup(db);
    const status=url.searchParams.get('status')||'all',page=Math.max(0,Math.min(10000,parseInt(url.searchParams.get('page')||'0')||0));
    if(!['all','new','progress','done'].includes(status))return json({error:'Invalid status'},400);
    const filter=status==='all'?'':' WHERE status=?';const params=status==='all'?[]:[status];
    const result=await db.prepare('SELECT * FROM inquiries'+filter+' ORDER BY created_at DESC,id LIMIT 20 OFFSET ?').bind(...params,page*20).all();
    const count=await db.prepare('SELECT COUNT(*) AS total FROM inquiries'+filter).bind(...params).first();
    return json({items:result.results,total:count.total,page});
   }
   const match=path.match(/^\/api\/admin\/inquiries\/([a-f0-9-]+)$/i);
   if(match&&UUID.test(match[1])){
    if(request.method==='PATCH'){
     const b=await readBody(request);if(!['new','progress','done'].includes(b.status)||typeof b.note!=='string'||b.note.length>4000)return json({error:'Invalid update'},400);
     const result=await db.prepare('UPDATE inquiries SET status=?,note=?,updated_at=? WHERE id=?').bind(b.status,b.note,now,match[1]).run();return json({ok:result.meta.changes>0},result.meta.changes?200:404);
    }
    if(request.method==='DELETE'){await db.prepare('DELETE FROM inquiries WHERE id=?').bind(match[1]).run();return json({ok:true})}
   }
  }
  return json({error:'Not found'},404);
 }catch(e){return json({error:e.status===429?'요청이 많습니다. 잠시 후 다시 시도해 주세요.':e.status?'Invalid request':'서비스 설정 또는 연결을 확인해 주세요.'},e.status||503)}
}};

