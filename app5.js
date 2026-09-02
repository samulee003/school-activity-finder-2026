function row(label,value){if(!value) return ''; return '<dt>'+esc(label)+'</dt><dd>'+nl(value)+'</dd>';}
function closeDetail(){if(typeof el.dialog.close==='function') el.dialog.close(); else el.dialog.removeAttribute('open');}
function openDetail(id){const x=DATA.find(item=>item.id===id); if(!x) return; el.dialogTitle.textContent=dash(x.title); el.dialogCategory.textContent=dash(x.category); el.dialogBody.innerHTML=(x.variants||[]).map(v=>'<section class="variant"><div class="variant-head"><div class="variant-title">'+esc(v.source_group)+' 原表 · 項目 #'+esc(v.source_no)+'</div><div class="variant-page">PDF 第 '+esc(v.source_page)+' 頁</div></div><dl class="dl">'+row('參與年級',v.grades_text)+row('上課日期',v.dates)+row('活動時間',v.time)+row('活動地點',v.location)+row('費用',v.fee)+row('備註',v.notes)+row('老師 / 查詢',v.contact)+'</dl>'+(v.description?'<div class="desc">'+esc(v.description)+'</div>':'')+'</section>').join(''); if(typeof el.dialog.showModal==='function') el.dialog.showModal(); else el.dialog.setAttribute('open','');}
function syncControls(){el.q.value=state.query; el.day.value=state.day; el.cat.value=state.category; el.fee.value=state.fee; el.source.value=state.source; el.sort.value=state.sort; el.favOnly.checked=state.favOnly; renderSummary(); renderCategoryCards();}
function clearOne(key){const d={query:'',grade:'all',group:'all',day:'all',category:'all',fee:'all',source:'all',favOnly:false}; if(key in d){state[key]=d[key]; syncControls(); render();}}
function clearAll(){Object.assign(state,{grade:'all',group:'all',query:'',day:'all',category:'all',fee:'all',source:'all',sort:'source',favOnly:false}); syncControls(); render(); mobileScrollToResults();}
function render(){renderCompare(); renderResults(); syncControls(); updateCollapseSummary();}
(async function init(){DATA=await loadData();const valid=new Set(DATA.map(x=>x.id)); let pruned=false; favorites.forEach(id=>{if(!valid.has(id)){favorites.delete(id); pruned=true;}}); if(pruned) saveFav(); const cats=[...new Set(DATA.map(x=>x.category))].sort((a,b)=>a.localeCompare(b,'zh-Hant')); cats.forEach(c=>{const o=document.createElement('option'); o.value=c; o.textContent=c; el.cat.appendChild(o);}); render();})().catch(err=>{console.error(err);document.body.insertAdjacentHTML('beforeend','<div style="position:fixed;left:12px;right:12px;bottom:12px;padding:12px;background:#fff3f0;border:1px solid #e8b8aa;border-radius:12px;z-index:9999;font-family:sans-serif">資料載入失敗，請重新整理頁面。</div>');});
el.gradeTabs.addEventListener('click',e=>{const b=e.target.closest('[data-grade]'); if(!b) return; state.grade=b.getAttribute('data-grade'); syncControls(); render(); mobileScrollToResults();});
el.categoryGrid.addEventListener('click',e=>{const b=e.target.closest('[data-group]'); if(!b) return; const next=b.getAttribute('data-group'); state.group=state.group===next&&next!=='all'?'all':next; state.category='all'; syncControls(); render(); mobileScrollToResults();});
document.getElementById('quickPills').addEventListener('click',e=>{const b=e.target.closest('[data-quick]'); if(!b) return; const k=b.getAttribute('data-quick'); if(k==='free') state.fee=state.fee==='free'?'all':'free'; if(k==='sat') state.day=state.day==='六'?'all':'六'; if(k==='fav') state.favOnly=!state.favOnly; if(k==='grade') state.grade=state.grade==='all'?'1':'all'; syncControls(); render(); mobileScrollToResults();});
el.q.addEventListener('input',e=>{state.query=e.target.value; render();});
el.day.addEventListener('change',e=>{state.day=e.target.value; render(); mobileScrollToResults();});
el.cat.addEventListener('change',e=>{state.category=e.target.value; if(state.category!=='all') state.group='all'; render(); mobileScrollToResults();});
el.fee.addEventListener('change',e=>{state.fee=e.target.value; render(); mobileScrollToResults();});
el.source.addEventListener('change',e=>{state.source=e.target.value; render(); mobileScrollToResults();});
el.sort.addEventListener('change',e=>{state.sort=e.target.value; render();});
el.favOnly.addEventListener('change',e=>{state.favOnly=e.target.checked; render();});
document.getElementById('resetBtn').addEventListener('click',clearAll);
document.getElementById('printBtn').addEventListener('click',()=>window.print());
document.getElementById('clearSearchBtn').addEventListener('click',()=>{state.query=''; el.q.value=''; render(); el.q.focus();});
el.activeFilters.addEventListener('click',e=>{const b=e.target.closest('[data-clear]'); if(b) clearOne(b.getAttribute('data-clear'));});
el.tbody.addEventListener('click',e=>{const reset=e.target.closest('[data-empty-reset]'); if(reset){clearAll(); return;} const fav=e.target.closest('[data-fav]'); if(fav){const id=fav.getAttribute('data-fav'); const adding=!favorites.has(id); adding?favorites.add(id):favorites.delete(id); saveFav(); render(); showToast(adding?'已加入收藏比較':'已取消收藏'); return;} const detail=e.target.closest('[data-detail]'); if(detail) openDetail(detail.getAttribute('data-detail'));});
el.mobileList.addEventListener('click',e=>{const reset=e.target.closest('[data-empty-reset]'); if(reset){clearAll(); return;} const fav=e.target.closest('[data-fav]'); if(fav){const id=fav.getAttribute('data-fav'); const adding=!favorites.has(id); adding?favorites.add(id):favorites.delete(id); saveFav(); render(); showToast(adding?'已加入收藏比較':'已取消收藏'); return;} const detail=e.target.closest('[data-detail]'); if(detail) openDetail(detail.getAttribute('data-detail'));});
el.favoritesPanel.addEventListener('click',e=>{const fav=e.target.closest('[data-fav]'); if(fav){const id=fav.getAttribute('data-fav'); const adding=!favorites.has(id); adding?favorites.add(id):favorites.delete(id); saveFav(); render(); showToast(adding?'已加入收藏比較':'已取消收藏'); return;} const detail=e.target.closest('[data-detail]'); if(detail) openDetail(detail.getAttribute('data-detail'));});
document.getElementById('closeDialog').addEventListener('click',closeDetail);
el.dialog.addEventListener('click',e=>{if(e.target===el.dialog) closeDetail();});
function syncStickyTop(){const cmd=document.querySelector('.command'); if(!cmd) return; document.documentElement.style.setProperty('--cmd-h', cmd.getBoundingClientRect().height+'px');}
function isMobile(){return window.matchMedia('(max-width:820px)').matches;}
function mobileScrollToResults(){ if(!isMobile()) return; const res=document.getElementById('results'); const cmd=document.querySelector('.command'); if(!res||!cmd) return; const top=res.getBoundingClientRect().top + window.scrollY - cmd.getBoundingClientRect().height - 8; if(Math.abs(window.scrollY - top) > 60) programmaticScrollTo(top); }
if(isMobile()){const f=document.querySelector('details.filters'); if(f) f.removeAttribute('open');}
const elCmd=document.querySelector('.command');
const collapseBar=document.getElementById('collapseBar');
const collapseSummary=document.getElementById('collapseSummary');
function updateCollapseSummary(){
  if(!collapseSummary) return;
  const n=DATA.length?filtered().length:DATA.length;
  const bits=[];
  if(state.grade!=='all') bits.push(gradeNames[Number(state.grade)]);
  if(state.group!=='all') bits.push(GROUP_MAP[state.group].title);
  else if(state.category!=='all') bits.push(state.category);
  if(state.day!=='all') bits.push(dayFull[state.day]||state.day);
  if(state.fee!=='all') bits.push(state.fee==='free'?'免費':'收費');
  if(state.favOnly) bits.push('已收藏');
  if(state.query.trim()) bits.push('「'+state.query.trim()+'」');
  collapseSummary.textContent=(bits.length?bits.join('・')+'｜':'')+n+' 個活動';
}
// Collapse/expand must never rely on smooth scrolling and must always compensate the
// scroll position: the bar is in normal flow, so its height change shifts the document
// and would otherwise feed back into the scroll-direction detector (oscillation loop).
let collapseFrozenUntil=0, lastScrollY=0;
let scrollAnim=null; // tracks a programmatic smooth scroll so its events don't toggle the bar
function applyCollapsed(collapse){
  if(!elCmd||elCmd.classList.contains('collapsed')===collapse) return;
  const before=elCmd.getBoundingClientRect().height;
  elCmd.classList.add('no-anim');
  elCmd.classList.toggle('collapsed',collapse);
  void elCmd.offsetHeight;
  const delta=elCmd.getBoundingClientRect().height-before;
  if(delta && window.scrollY>0 && document.documentElement.scrollHeight>window.innerHeight) window.scrollBy(0,delta);
  requestAnimationFrame(()=>elCmd.classList.remove('no-anim'));
  collapseFrozenUntil=performance.now()+400;
  lastScrollY=window.scrollY;
  syncStickyTop();
}
function programmaticScrollTo(top){
  const from=window.scrollY;
  scrollAnim={target:top, dir:Math.sign(top-from)};
  window.scrollTo({top,behavior:'smooth'});
}
function onScrollCollapse(){
  const y=window.scrollY;
  if(scrollAnim){
    if(Math.abs(y-scrollAnim.target)<=2){scrollAnim=null;}
    else{
      const approaching=scrollAnim.dir>0?y>lastScrollY:y<lastScrollY;
      if(approaching){lastScrollY=y;return;}
      scrollAnim=null; // user took over
    }
  }
  if(performance.now()<collapseFrozenUntil){lastScrollY=y;syncStickyTop();return;}
  if(isMobile()&&elCmd){
    const dy=y-lastScrollY;
    const dialogOpen=el.dialog.open||el.dialog.hasAttribute('open');
    if(dy>10 && y>80 && !dialogOpen) applyCollapsed(true);
    else if(dy<-10 || y<=80 || dialogOpen) applyCollapsed(false);
    updateCollapseSummary();
  }
  lastScrollY=window.scrollY;
  syncStickyTop();
}
window.addEventListener('scroll',onScrollCollapse,{passive:true});
function expandCommand(){applyCollapsed(false);}
if(collapseBar){
  collapseBar.addEventListener('click',expandCommand);
  collapseBar.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();expandCommand();}});
}
// focus jump: tapping the collapsed search pill expands and focuses the real input
const collapseSearch=document.querySelector('.collapse-search');
if(collapseSearch) collapseSearch.addEventListener('click',()=>{expandCommand(); setTimeout(()=>el.q.focus(),120);});
// expand instantly (no transition) so the auto-scroll measures the final height
function expandCommandInstant(){
  if(!elCmd||!elCmd.classList.contains('collapsed')) return false;
  elCmd.classList.add('no-anim'); elCmd.classList.remove('collapsed');
  void elCmd.offsetHeight;
  requestAnimationFrame(()=>elCmd.classList.remove('no-anim'));
  collapseFrozenUntil=performance.now()+400;
  lastScrollY=window.scrollY;
  syncStickyTop();
  return true;
}
const _origMobileScroll=mobileScrollToResults;
mobileScrollToResults=function(){expandCommandInstant(); _origMobileScroll();};
window.addEventListener('resize',()=>{if(elCmd&&!isMobile()) elCmd.classList.remove('collapsed'); syncStickyTop();});
onScrollCollapse();
document.addEventListener('keydown',e=>{if(e.key==='Escape' && (el.dialog.open||el.dialog.hasAttribute('open'))){closeDetail(); return;} if(e.key==='/' && !e.metaKey && !e.ctrlKey && !e.altKey && !(el.dialog.open||el.dialog.hasAttribute('open'))){const tag=(e.target&&e.target.tagName)||''; if(!['INPUT','TEXTAREA','SELECT'].includes(tag)){e.preventDefault(); el.q.focus();}}});
