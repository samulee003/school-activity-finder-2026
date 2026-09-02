let DATA=[];
const gradeNames={1:'小一',2:'小二',3:'小三',4:'小四',5:'小五',6:'小六'};
const dayFull={一:'星期一',二:'星期二',三:'星期三',四:'星期四',五:'星期五',六:'星期六',日:'星期日',天:'星期日'};
const IMAGE_MAP=window.__IMAGE_MAP__||{};
const FALLBACK_IMAGE="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23f2ede5'/%3E%3C/svg%3E";
function imageFor(key){return IMAGE_MAP[key]||IMAGE_MAP.doc||FALLBACK_IMAGE;}

async function loadData(){
  if(Array.isArray(window.__DATA__) && window.__DATA__.length) return window.__DATA__;
  const encoded=window.__DATA_GZIP__;
  if(typeof encoded!=='string'||!encoded) throw new Error('Activity data is unavailable');
  if(typeof Blob==='undefined'||typeof Blob.prototype.stream!=='function'||typeof DecompressionStream==='undefined'){
  throw new Error('Plain activity data is unavailable');
  }
  try{
  const bin=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  const stream=new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text());
  }catch(error){
  throw new Error('Activity data could not be decompressed',{cause:error});
  }
  }
const GROUPS=[
  {id:'all', title:'全部活動', desc:'查看全部', cats:null, image:imageFor('doc')},
  {id:'art', title:'藝術・創作', desc:'藝術、手作、舞蹈', cats:['藝術・創作','舞蹈'], image:imageFor('art')},
  {id:'music', title:'音樂・表演', desc:'音樂與舞台表現', cats:['音樂','領袖・表演'], image:imageFor('music')},
  {id:'sport', title:'體育・運動', desc:'球類與身體活動', cats:['體育'], image:imageFor('sport')},
  {id:'stem', title:'STEM・科技', desc:'AI、科技、數理', cats:['STEM・科技','數學・思維'], image:imageFor('ai')},
  {id:'language', title:'語言・閱讀', desc:'閱讀、表達、語言', cats:['語言・表達','語言學習'], image:imageFor('book')},
  {id:'growth', title:'成長・桌遊', desc:'情緒、桌遊、團體', cats:['成長・情緒','棋藝・桌遊','信仰・團體'], image:imageFor('well')}
];
const GROUP_MAP=Object.fromEntries(GROUPS.map(g=>[g.id,g]));
const el={
  q:document.getElementById('q'), day:document.getElementById('daySel'), cat:document.getElementById('catSel'), fee:document.getElementById('feeSel'), source:document.getElementById('sourceSel'), sort:document.getElementById('sortSel'), favOnly:document.getElementById('favOnly'),
  gradeTabs:document.getElementById('gradeTabs'), categoryGrid:document.getElementById('categoryGrid'), heroStats:document.getElementById('heroStats'), filterCountText:document.getElementById('filterCountText'), gradeQuickLabel:document.getElementById('gradeQuickLabel'),
  resultCount:document.getElementById('resultCount'), resultContext:document.getElementById('resultContext'), resultSubtitle:document.getElementById('resultSubtitle'), toast:document.getElementById('toast'), activeFilters:document.getElementById('activeFilters'), favoritesPanel:document.getElementById('favoritesPanel'), tbody:document.getElementById('tbody'), mobileList:document.getElementById('mobileList'),
  dialog:document.getElementById('detailDialog'), dialogTitle:document.getElementById('dialogTitle'), dialogCategory:document.getElementById('dialogCategory'), dialogBody:document.getElementById('dialogBody')
};
const state={grade:'all',group:'all',query:'',day:'all',category:'all',fee:'all',source:'all',sort:'source',favOnly:false};
let favorites=new Set();
try{favorites=new Set(JSON.parse(localStorage.getItem('eca-favorites-2026')||'[]'));}catch(e){}
function saveFav(){localStorage.setItem('eca-favorites-2026', JSON.stringify([...favorites]));}
let toastTimer=null;
function showToast(message){if(!el.toast)return; el.toast.textContent=message; el.toast.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.toast.classList.remove('show'),1400);}
function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function nl(s){return esc(s||'').replace(/\n/g,'<br>');}
function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,'').replace(/[【】〔〕（）()\-_.:：・]/g,'');}
function dash(s){return s?String(s):'—';}
function sourceOrder(x){const v=(x.variants||[]).slice().sort((a,b)=>a.source_group.localeCompare(b.source_group,'zh-Hant')||a.source_no-b.source_no)[0]; return v?((v.source_group==='小一二'?0:1000)+v.source_no):99999;}
function queryRank(x,q){if(!q)return 9; const nq=norm(q); if(norm(x.title).includes(nq)) return 0; if(norm(x.category).includes(nq)) return 1; return 2;}
function scoped(g){return g==='all'?DATA:DATA.filter(x=>x.grades.includes(Number(g)));}
function gradeCount(g){return scoped(g).length;}
function freeCount(g){return scoped(g).filter(x=>x.is_free).length;}
function satCount(g){return scoped(g).filter(x=>x.days.includes('六')).length;}
function groupCount(groupId){const g=GROUP_MAP[groupId]; if(!g||!g.cats) return DATA.length; return DATA.filter(x=>g.cats.includes(x.category)).length;}
function activeFilterCount(){return [state.grade!=='all',state.group!=='all',state.day!=='all',state.category!=='all',state.fee!=='all',state.source!=='all',state.favOnly,!!state.query].filter(Boolean).length;}
function filtered(){
  const q=state.query.trim();
  const nq=norm(q);
  const group=GROUP_MAP[state.group];
  const arr=DATA.filter(x=>{
    if(q && !(norm(x.search).includes(nq)||norm(x.category).includes(nq))) return false;
    if(state.grade!=='all' && !x.grades.includes(Number(state.grade))) return false;
    if(group && group.cats && !group.cats.includes(x.category)) return false;
    if(state.category!=='all' && x.category!==state.category) return false;
    if(state.day!=='all' && !x.days.includes(state.day)) return false;
    if(state.fee==='free' && !x.is_free) return false;
    if(state.fee==='paid' && x.is_free) return false;
    if(state.source!=='all' && !x.source_groups.includes(state.source)) return false;
    if(state.favOnly && !favorites.has(x.id)) return false;
    return true;
  });
  arr.sort((a,b)=>{
    if(q){const qr=queryRank(a,q)-queryRank(b,q); if(qr) return qr;}
    if(state.sort==='title') return a.title.localeCompare(b.title,'zh-Hant');
    if(state.sort==='free') return Number(b.is_free)-Number(a.is_free)||sourceOrder(a)-sourceOrder(b);
    return sourceOrder(a)-sourceOrder(b);
  });
  return arr;
}
function heroBadge(label,value){return '<span class="summary-badge"><strong>'+esc(value)+'</strong>'+esc(label)+'</span>';}
function renderSummary(){
  el.heroStats.innerHTML=heroBadge('個活動', DATA.length)+heroBadge('個收藏', favorites.size)+heroBadge('個免費', freeCount('all'))+heroBadge('個星期六活動', satCount('all'));
  const grades=['all',1,2,3,4,5,6].filter(g=>g==='all'||gradeCount(String(g))>0);
  el.gradeTabs.innerHTML=grades.map(g=>{const label=g==='all'?'全部':gradeNames[g]; const count=g==='all'?DATA.length:gradeCount(String(g)); return '<button class="grade-chip '+(String(g)===state.grade?'active':'')+'" type="button" data-grade="'+g+'"><strong>'+label+'</strong><span>'+count+' 個活動</span></button>';}).join('');
  el.gradeQuickLabel.textContent=state.grade==='all'?'我的年級':gradeNames[Number(state.grade)];
  const n=activeFilterCount(); el.filterCountText.textContent=n?('目前已套用 '+n+' 個條件'):'目前未套用其他條件';
}
function renderCategoryCards(){
  el.categoryGrid.innerHTML=GROUPS.map(g=>'<button class="category-card '+(state.group===g.id?'active':'')+'" type="button" data-group="'+g.id+'"><img src="'+g.image+'" alt="'+esc(g.title)+'"><strong>'+esc(g.title)+'</strong><span>'+esc(g.desc)+'</span><small>'+groupCount(g.id)+' 個活動</small></button>').join('');
}
function token(label,key){return '<span class="token">'+esc(label)+'<button type="button" data-clear="'+key+'">×</button></span>';}
function renderActiveFilters(){
  const parts=[];
  if(state.query) parts.push(token('搜尋：'+state.query,'query'));
  if(state.grade!=='all') parts.push(token(gradeNames[Number(state.grade)],'grade'));
  if(state.group!=='all') parts.push(token(GROUP_MAP[state.group].title,'group'));
  if(state.category!=='all') parts.push(token(state.category,'category'));
  if(state.day!=='all') parts.push(token(dayFull[state.day]||state.day,'day'));
  if(state.fee!=='all') parts.push(token(state.fee==='free'?'免費':'收費','fee'));
  if(state.source!=='all') parts.push(token(state.source,'source'));
  if(state.favOnly) parts.push(token('已收藏','favOnly'));
  el.activeFilters.innerHTML=parts.join('');
}
function toMinutes(raw){const s=String(raw||'').trim(); if(!s) return null; let m=s.match(/^(\d{1,2})[:：](\d{2})$/); if(m) return Number(m[1])*60+Number(m[2]); m=s.match(/^(\d{3,4})$/); if(m){const n=m[1]; const h=Number(n.length===3?n.slice(0,1):n.slice(0,2)); const mm=Number(n.slice(-2)); return h*60+mm;} return null;}
function parseSlots(course){const slots=[]; const texts=[]; if(course.time_summary) texts.push(course.time_summary); (course.variants||[]).forEach(v=>{if(v.time) texts.push(v.time);}); const fallback=(course.days||[]).length?course.days:[]; texts.forEach(text=>{String(text||'').split(/\n+/).forEach(line=>{const clean=line.replace(/\s+/g,' ').trim(); if(!clean) return; const dayMatches=[...new Set((clean.match(/[一二三四五六日天]/g)||[]))]; const days=dayMatches.length?dayMatches.filter(d=>dayFull[d]):fallback; const reg=/(\d{1,2}[:：]?\d{2}|\d{3,4})\s*[-–—_~～至]\s*(\d{1,2}[:：]?\d{2}|\d{3,4})/g; let rm, matched=false; while((rm=reg.exec(clean))){matched=true; const st=toMinutes(String(rm[1]).replace('：',':')); const en=toMinutes(String(rm[2]).replace('：',':')); if(st==null||en==null) continue; (days.length?days:['?']).forEach(day=>slots.push({day,start:st,end:en}));} if(!matched && fallback.length){const m=clean.match(/(\d{1,2}[:：]?\d{2}|\d{3,4})\s*(?:[-–—_~～至])\s*(\d{1,2}[:：]?\d{2}|\d{3,4})/); if(m){const st=toMinutes(String(m[1]).replace('：',':')); const en=toMinutes(String(m[2]).replace('：',':')); if(st!=null&&en!=null){fallback.forEach(day=>slots.push({day,start:st,end:en}));}}}});}); const uniq=new Map(); slots.forEach(s=>{const k=[s.day,s.start,s.end].join('|'); if(!uniq.has(k)) uniq.set(k,s);}); return [...uniq.values()];}
function overlaps(a,b){return a.start < b.end && b.start < a.end;}
const coverageCache=new Map();
function pad2(n){return String(n).padStart(2,'0');}
function academicYear(month){return Number(month)>=8?2026:2027;}
function dateKey(month,day){const m=Number(month),d=Number(day); if(!(m>=1&&m<=12&&d>=1&&d<=31)) return null; return academicYear(m)+'-'+pad2(m)+'-'+pad2(d);}
