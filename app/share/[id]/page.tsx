"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Axis = { label:string; score:number; level?:string };
type Result = { id:string; kind:"temperament"|"chewing"; lang:"ko"|"en"|"zh"|"ja"; petName:string; resultTitle:string; hook:string; description:string; mbti?:string; breedImageSrc?:string; breedImagePosition?:string; axes:Axis[] };

function DogVisual({data}:{data:Result}) {
  const sprite = Boolean(data.breedImagePosition && data.breedImagePosition !== "50% 50%");
  if (!sprite) return <img src={data.breedImageSrc || "/home-v49-ref-tip-dog.png"} alt="강아지"/>;
  return <span className="shared-dog-sprite" style={{backgroundImage:`url(${data.breedImageSrc})`,backgroundPosition:data.breedImagePosition,backgroundSize:"300% 200%"}}/>;
}

function ResultCard({data, zoomHint=true}:{data:Result;zoomHint?:boolean}) {
  const temperament=data.kind==="temperament";
  return <section className={`shared-result-card ${temperament?"temperament":"chewing"}`}>
    <div className="shared-result-kicker">{temperament?"우리 아이 기질은":"우리 아이 물어뜯기 유형은"}</div>
    <h1>{data.resultTitle}</h1>
    <div className="shared-result-main"><div>{temperament&&<><small>DOG MBTI</small><b>{data.mbti||"—"}</b></>}<p>{data.description||data.hook}</p></div><div className="shared-dog"><DogVisual data={data}/></div></div>
    {!!data.axes?.length&&<><h2>{temperament?"4가지 핵심 성향":"행동 성향"}</h2><div className="shared-axis-grid">{data.axes.slice(0,temperament?4:8).map((a,i)=><article key={i}><span>{a.label}</span><strong>{a.level||`${a.score}`}</strong><i><em style={{width:`${a.score}%`}}/></i></article>)}</div></>}
    {zoomHint&&<div className="shared-tap-hint">🔍 탭해서 크게 보기</div>}
  </section>;
}

export default function SharedResultPage() {
  const params=useParams<{id:string}>(); const [data,setData]=useState<Result|null>(null); const [error,setError]=useState(false); const [zoom,setZoom]=useState(false);
  useEffect(()=>{fetch(`/api/share?id=${encodeURIComponent(params.id)}`,{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then(setData).catch(()=>setError(true));},[params.id]);
  if(error)return <main className="shared-result-page"><div className="shared-result-empty"><b>공유 결과를 찾을 수 없습니다.</b><a href="/">BitterCare 시작하기</a></div></main>;
  if(!data)return <main className="shared-result-page"><div className="shared-result-loading">결과를 불러오는 중...</div></main>;
  return <main className="shared-result-page"><header><img src="/bittercare-logo-ref-v30.png" alt="BitterCare"/><span>공유 결과</span></header><div onClick={()=>setZoom(true)} role="button" tabIndex={0} aria-label="결과 크게 보기"><ResultCard data={data}/></div><section className="shared-result-cta"><h3>우리 아이도 궁금하다면? 🐶</h3><p>같은 체크를 바로 시작해보세요.</p><a href={`/?ref=shared_result&type=${data.kind}`}>우리 아이도 해보기</a></section>{zoom&&<div className="shared-result-zoom" onClick={()=>setZoom(false)}><button aria-label="닫기">×</button><div onClick={e=>e.stopPropagation()}><ResultCard data={data} zoomHint={false}/><p className="shared-zoom-guide">두 손가락으로 확대해서 자세히 볼 수 있어요.</p></div></div>}</main>;
}
