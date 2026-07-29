const LESSONS = [
  {
    id:"hook-paradox", book:1, order:1, title:"왜?를 만드는 역설형 훅",
    goal:"상식을 뒤집어 시청자의 머릿속에 질문을 만드는 법",
    concept:"역설형 훅은 사람들이 당연하다고 믿는 내용을 반대로 말해 ‘왜?’를 만듭니다.",
    weak:"손님이 많아지면 식당 운영이 힘들 수 있습니다.",
    strong:"손님이 너무 많이 와서 이 식당은 무너졌습니다.",
    video:"https://www.youtube.com/shorts/2XGnDl87Ft0",
    summary:"첫 문장에서 성공처럼 보이는 상황을 문제로 뒤집고, 중간과 결말에서 그 이유를 풀어갑니다.",
    prompt:"이 영상이 처음 만든 질문은 무엇입니까?",
    answer:"손님이나 관심이 많아지는 좋은 일이 왜 오히려 사업을 무너뜨렸는가?",
    quiz:["식당 운영이 어려운 이유","손님이 없어 문을 닫은 식당","손님이 너무 많아 문을 닫은 식당"],
    correct:2,
    takeaway:"좋은 훅은 답을 주는 문장이 아니라, 다음 장면을 봐야 풀리는 질문을 만든다."
  },
  {
    id:"hook-contrast", book:1, order:2, title:"숫자보다 강한 행동의 대비",
    goal:"예상과 실제 행동의 간격이 시선을 붙드는 원리",
    concept:"대비형 훅은 숫자 하나가 아니라, 그 숫자에서 예상하기 어려운 행동을 함께 보여줍니다.",
    weak:"92세에도 건강하게 사는 방법입니다.",
    strong:"92세인 이 사람이 오늘도 다른 사람을 지도합니다.",
    video:"https://www.youtube.com/results?search_query=92+year+old+fitness+coach+shorts",
    summary:"높은 나이와 활발한 행동을 한 장면 안에서 충돌시켜 ‘어떻게 가능하지?’라는 질문을 만듭니다.",
    prompt:"이 영상에서 숫자보다 더 강한 장면은 무엇입니까?",
    answer:"92세라는 나이와 타인을 직접 지도하는 현재 행동이 동시에 보이는 장면입니다.",
    quiz:["나이를 크게 자막으로 표시","나이와 예상 밖 행동을 동시에 제시","빠른 장면 전환"],
    correct:1,
    takeaway:"구체적인 숫자는 행동과 충돌할 때 비로소 강한 훅이 된다."
  },
  {
    id:"retention-openloop", book:2, order:1, title:"답을 미루는 열린 고리",
    goal:"훅 이후에도 시청자가 떠나지 않게 답을 나누는 법",
    concept:"열린 고리는 질문을 만든 뒤 답을 한꺼번에 주지 않고, 단계마다 일부만 공개합니다.",
    weak:"오늘 세 가지 방법을 모두 바로 알려드리겠습니다.",
    strong:"세 번째 방법은 대부분이 반대로 알고 있습니다.",
    video:"https://www.youtube.com/results?search_query=open+loop+shorts+marketing",
    summary:"결말의 핵심을 미리 암시하지만 공개를 늦춰 중간 구간을 통과하게 합니다.",
    prompt:"이 영상은 어떤 답을 마지막까지 미룹니까?",
    answer:"가장 의외이거나 중요한 마지막 항목의 구체적인 내용을 미룹니다.",
    quiz:["말을 빠르게 한다","핵심 답의 일부를 마지막까지 남긴다","자막을 크게 쓴다"],
    correct:1,
    takeaway:"훅이 문을 열었다면, 열린 고리는 시청자를 결말까지 데려간다."
  }
];

const BOOKS=["멈추게 하는 힘","계속 보게 하는 힘","믿게 하는 힘","행동하게 하는 힘","반복하고 현지화하는 힘"];
const STORAGE_KEY="gvor_v9_state";
let state=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"records":{},"currentLessonId":"hook-paradox","updatedAt":0}');
let activeLesson=null, page=0, draft={};
let auth=null, db=null, user=null, cloudReady=false;

const $=s=>document.querySelector(s);
const escapeHtml=s=>(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function saveLocal(){
  state.updatedAt=Date.now();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  if(user&&cloudReady) pushCloud();
}
function completedIds(){return Object.entries(state.records).filter(([,r])=>r.completed).map(([id])=>id)}
function nextLesson(){return LESSONS.find(l=>!state.records[l.id]?.completed)||LESSONS[LESSONS.length-1]}
function route(){const name=(location.hash||"#today").slice(1).split("/")[0]; name==="lesson"?renderLesson():name==="library"?renderLibrary():name==="growth"?renderGrowth():renderToday()}

function renderToday(){
  const app=$("#app"), t=$("#todayTemplate").content.cloneNode(true), lesson=nextLesson(), done=completedIds().length;
  t.querySelector("#lessonTitle").textContent=lesson.title;
  t.querySelector("#lessonGoal").textContent=lesson.goal;
  t.querySelector("#progressBar").style.width=`${done/LESSONS.length*100}%`;
  t.querySelector("#progressText").textContent=`기초 교재 ${done}/${LESSONS.length}편 완료`;
  t.querySelector("#startLesson").onclick=()=>{activeLesson=lesson;page=0;draft={};location.hash="#lesson"};
  app.replaceChildren(t);
}
function renderLesson(){
  activeLesson=activeLesson||LESSONS.find(l=>l.id===state.currentLessonId)||nextLesson();
  const app=$("#app"), t=$("#lessonTemplate").content.cloneNode(true);
  app.replaceChildren(t); drawPage();
}
function drawPage(){
  const l=activeLesson, host=$("#lessonPage"), pages=[
    `<h1>${l.title}</h1><p class="lead">${l.concept}</p><div class="example"><b>약한 예</b><br>${l.weak}</div><div class="example"><b>강한 예</b><br>${l.strong}</div><p>${l.strong.includes("?")?"질문형 문장":"강한 문장"}은 정보를 끝내지 않고 다음 장면에서 풀어야 할 빈칸을 남깁니다.</p>`,
    `<h2>이제 영상에서 찾아보세요</h2><p>${l.summary}</p><a class="video-link" href="${l.video}" target="_blank" rel="noopener">원본 영상 보기</a><p class="muted">영상을 본 뒤 앱으로 돌아오세요. 성공 이유는 아직 공개하지 않습니다.</p>`,
    `<h2>내가 먼저 찾기</h2><p>${l.prompt}</p><textarea id="judgment" rows="6" placeholder="한 문장으로 적어보세요.">${escapeHtml(draft.judgment||"")}</textarea><p>확신도</p><div class="choices">${[1,2,3,4,5].map(n=>`<label class="choice"><input type="radio" name="confidence" value="${n}" ${draft.confidence==n?"checked":""}> ${n}</label>`).join("")}</div>`,
    `<h2>선생님의 사고 과정</h2><p>먼저 영상이 던진 질문을 찾고, 그 질문이 어느 장면에서 풀리는지 봅니다. 편집 속도보다 <b>해결되지 않은 질문</b>을 먼저 확인합니다.</p><div class="feedback"><b>모범 관찰</b><br>${l.answer}</div><h3>오늘 가져갈 공식</h3><p>${l.takeaway}</p>`,
    `<h2>이해 확인</h2><p>다음 중 오늘 배운 구조에 가장 가까운 것은?</p><div class="choices">${l.quiz.map((q,i)=>`<label class="choice"><input type="radio" name="quiz" value="${i}"> ${q}</label>`).join("")}</div><div id="quizFeedback"></div>`,
    `<h2>내 말로 설명하고 적용하기</h2><p>오늘 배운 원리를 내 말로 설명하세요.</p><textarea id="teachback" rows="4">${escapeHtml(draft.teachback||"")}</textarea><p>한국 소상공인 또는 일본 시니어용 훅 한 줄을 만드세요.</p><textarea id="application" rows="4">${escapeHtml(draft.application||"")}</textarea><div id="finishFeedback"></div>`,
    `<p class="eyebrow">오늘의 결론</p><h1>${l.takeaway}</h1><p>이 문장을 다음 수업 시작 전에 다시 떠올려 보세요.</p><button id="finishLesson" class="button primary">수업 완료하고 다음으로</button>`
  ];
  $("#pageLabel").textContent=`${page+1} / ${pages.length}`;
  host.innerHTML=pages[page];
  $("#prevPage").disabled=page===0;
  $("#nextPage").textContent=page===pages.length-1?"오늘로 돌아가기":"다음";
  $("#prevPage").onclick=()=>{capture();page--;drawPage()};
  $("#nextPage").onclick=()=>{if(!validatePage())return;capture(); if(page<pages.length-1){page++;drawPage()}else location.hash="#today"};
  if(page===4) host.querySelectorAll('input[name=quiz]').forEach(x=>x.onchange=()=>{draft.quiz=Number(x.value);$("#quizFeedback").innerHTML=draft.quiz===l.correct?'<div class="feedback">정확합니다. 다음 단계로 갈 수 있습니다.</div>':'<div class="feedback">다시 보세요. 핵심은 겉모양이 아니라 시청자의 머릿속에 남겨둔 질문입니다.</div>'});
  if(page===6) $("#finishLesson").onclick=()=>{completeLesson();location.hash="#today"};
}
function capture(){
  if($("#judgment")){draft.judgment=$("#judgment").value.trim();draft.confidence=Number(document.querySelector('input[name=confidence]:checked')?.value||0)}
  if($("#teachback")){draft.teachback=$("#teachback").value.trim();draft.application=$("#application").value.trim()}
}
function validatePage(){
  capture();
  if(page===2&&(!draft.judgment||!draft.confidence)){alert("먼저 한 문장 판단과 확신도를 남겨주세요.");return false}
  if(page===4&&draft.quiz!==activeLesson.correct){alert("확인문제를 맞힌 뒤 다음으로 갈 수 있습니다.");return false}
  if(page===5&&(!draft.teachback||!draft.application)){alert("내 말로 설명하고 적용 문장을 한 줄 써주세요.");return false}
  return true;
}
function completeLesson(){
  state.records[activeLesson.id]={...draft,completed:true,completedAt:Date.now(),lessonId:activeLesson.id};
  state.currentLessonId=nextLesson().id; saveLocal();
}
function renderLibrary(){
  $("#app").innerHTML=`<section><p class="eyebrow">5권 · 100편 구조</p><h1>책장</h1><div class="library">${BOOKS.map((b,i)=>`<div class="book"><b>${i+1}권. ${b}</b><p>${LESSONS.filter(l=>l.book===i+1&&state.records[l.id]?.completed).length}/${LESSONS.filter(l=>l.book===i+1).length||20}편 완료 · 나머지는 검증 연구 대기</p></div>`).join("")}</div></section>`;
}
function renderGrowth(){
  const records=Object.values(state.records), avg=records.length?Math.round(records.reduce((s,r)=>s+(r.confidence||0),0)/records.length*20):0;
  $("#app").innerHTML=`<section class="hero"><p class="eyebrow">나의 판단 지문</p><h1>${records.length}편을 끝냈습니다</h1><p class="lead">평균 확신도 ${avg}% · 모든 첫 판단과 적용 문장을 보존하고 있습니다.</p><button id="exportData" class="button secondary">기록 내보내기</button><label class="button secondary">기록 불러오기<input id="importData" type="file" accept=".json" hidden></label><div class="library">${records.map(r=>`<div class="book"><b>${LESSONS.find(l=>l.id===r.lessonId)?.title||r.lessonId}</b><p>내 판단: ${escapeHtml(r.judgment)}</p><p>내 적용: ${escapeHtml(r.application)}</p></div>`).join("")}</div></section>`;
  $("#exportData").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));a.download="GVOR-v9-records.json";a.click()};
  $("#importData").onchange=async e=>{const incoming=JSON.parse(await e.target.files[0].text());state=mergeStates(state,incoming);saveLocal();renderGrowth()};
}
function mergeStates(a,b){
  const out={...a,...b,records:{...(a.records||{})}};
  for(const [id,r] of Object.entries(b.records||{})){if(!out.records[id]||(r.completedAt||0)>(out.records[id].completedAt||0))out.records[id]=r}
  return out;
}
async function initFirebase(){
  const cfg=window.GVOR_FIREBASE_CONFIG;
  if(!cfg){$("#syncStatus").textContent="기기에 저장됨";return}
  firebase.initializeApp(cfg);auth=firebase.auth();db=firebase.firestore();cloudReady=true;
  await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
  try{await auth.getRedirectResult()}catch(error){
    $("#syncStatus").textContent="로그인 실패";
    console.error("Google redirect sign-in failed",error);
  }
  auth.onAuthStateChanged(async u=>{
    user=u; $("#loginButton").classList.toggle("hidden",!!u);$("#logoutButton").classList.toggle("hidden",!u);
    if(u){$("#syncStatus").textContent="동기화 중";await pullCloud();$("#syncStatus").textContent="동기화 완료";route()}
    else $("#syncStatus").textContent="기기에 저장됨";
  });
}
async function pullCloud(){
  const ref=db.collection("users").doc(user.uid).collection("state").doc("main"), snap=await ref.get();
  if(snap.exists){state=mergeStates(state,snap.data());localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
  await pushCloud();
}
async function pushCloud(){
  if(!user||!db)return;$("#syncStatus").textContent=navigator.onLine?"동기화 중":"오프라인 저장";
  try{await db.collection("users").doc(user.uid).collection("state").doc("main").set(state,{merge:true});$("#syncStatus").textContent="동기화 완료"}catch(e){$("#syncStatus").textContent="오프라인 저장"}
}
$("#loginButton").onclick=async()=>{
  if(!auth){alert("Firebase 연결 설정이 아직 완료되지 않았습니다.");return}
  try{
    $("#syncStatus").textContent="Google 로그인 이동 중";
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    const provider=new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:"select_account"});
    await auth.signInWithRedirect(provider);
  }catch(error){
    console.error("Google redirect sign-in failed",error);
    $("#syncStatus").textContent="로그인 실패";
    alert(`Google 로그인에 실패했습니다.\n${error.code||"알 수 없는 오류"}`);
  }
};
$("#logoutButton").onclick=()=>auth.signOut();
window.addEventListener("hashchange",route);window.addEventListener("online",()=>pushCloud());
initFirebase();route();
