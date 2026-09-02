function renderResults(){
  const list=filtered();
  const conflictSet=favoriteConflictSet();
  el.resultCount.textContent=String(list.length);
  const context=[];
  if(state.grade!=='all') context.push(gradeNames[Number(state.grade)]);
  if(state.group!=='all') context.push(GROUP_MAP[state.group].title);
  else if(state.category!=='all') context.push(state.category);
  if(state.day!=='all') context.push(dayFull[state.day]||state.day);
  if(state.fee!=='all') context.push(state.fee==='free'?'免費':'收費');
  if(state.favOnly) context.push('已收藏');
  el.resultContext.textContent=context.length?context.join('・'):'全部';
  el.resultSubtitle.textContent=(context.length?context.join('・'):'全部活動')+'｜'+list.length+' 個活動';
  document.querySelectorAll('[data-quick]').forEach(b=>b.classList.remove('active'));
  const q1=document.querySelector('[data-quick="free"]'); if(q1 && state.fee==='free') q1.classList.add('active');
  const q2=document.querySelector('[data-quick="sat"]'); if(q2 && state.day==='六') q2.classList.add('active');
  const q3=document.querySelector('[data-quick="fav"]'); if(q3 && state.favOnly) q3.classList.add('active');
  const q4=document.querySelector('[data-quick="grade"]'); if(q4 && state.grade!=='all') q4.classList.add('active');
  renderActiveFilters();
  if(!list.length){
    el.tbody.innerHTML='<tr><td colspan="7"><div class="empty"><h3>找不到符合條件的活動</h3><p>請調整篩選條件，或清除篩選後再搜尋。</p><button class="btn-primary" type="button" data-empty-reset>清除篩選</button></div></td></tr>';
    el.mobileList.innerHTML='<div class="empty"><h3>找不到符合條件的活動</h3><p>請調整篩選條件，或清除篩選後再搜尋。</p><button class="btn-primary" type="button" data-empty-reset>清除篩選</button></div>';
    return;
  }
  el.tbody.innerHTML=list.map(x=>desktopRow(x,conflictSet)).join('');
  el.mobileList.innerHTML=list.map(x=>mobileCard(x,conflictSet)).join('');
}
