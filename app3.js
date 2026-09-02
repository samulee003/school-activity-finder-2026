function renderCompare(){
  const fav=[...favorites].map(id=>DATA.find(x=>x.id===id)).filter(Boolean);
  if(!fav.length){
    el.favoritesPanel.innerHTML='<div class="compare-emptybar"><img src="'+imageFor('cards')+'" alt=""><div><strong>⭐ 收藏 0</strong><span>按星號加入比較</span></div></div>';
    return;
  }
  const free=fav.filter(x=>x.is_free).length, paid=fav.length-free, conflicts=findConflicts(fav), conflictSet=favoriteConflictSet();
  el.favoritesPanel.innerHTML='<div class="compare-head"><div><h3>收藏比較</h3><p>已加入 '+fav.length+' 個活動</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn-soft" id="favOnlyBtn" type="button">只看收藏</button><button class="btn-soft" id="clearFavBtn" type="button">清空收藏</button></div></div><div class="badges"><span class="badge">⭐ <strong>'+fav.length+'</strong> 個收藏</span><span class="badge">💸 <strong>'+free+'</strong> 個免費</span><span class="badge">🧾 <strong>'+paid+'</strong> 個收費</span>'+(state.grade!=='all'?'<span class="badge">🎒 <strong>'+gradeNames[Number(state.grade)]+'</strong></span>':'')+'</div>'+(conflicts.length?'<div class="conflicts"><div><h4>時間衝突</h4><ul>'+conflicts.map(c=>'<li>'+esc(c.a.title)+' × '+esc(c.b.title)+'：'+esc(dayFull[c.day]||c.day)+' 時段重疊</li>').join('')+'</ul></div><img src="'+imageFor('calendar')+'" alt="時間提醒插圖"></div>':'')+'<div class="compare-grid">'+fav.map(x=>'<article class="compare-card"><div class="compare-title"><img src="'+courseImage(x)+'" alt="'+esc(x.category)+'"><div><h4>'+esc(x.title)+'</h4><div class="compare-tags"><span class="mini-tag">'+esc(x.category)+'</span>'+(conflictSet.has(x.id)?'<span class="mini-tag" style="background:var(--danger-soft);color:var(--danger)">可能撞堂</span>':'')+'</div></div><button class="btn" type="button" data-fav="'+esc(x.id)+'">移除</button></div><div class="compare-meta"><div class="compare-row"><span>年級</span><strong>'+esc(x.grades.map(g=>gradeNames[g]).join(' · '))+'</strong></div><div class="compare-row"><span>時間</span><strong>'+nl(dash(x.time_summary||'詳見'))+'</strong></div><div class="compare-row"><span>地點</span><strong>'+esc(dash(x.location_summary||'詳見'))+'</strong></div><div class="compare-row"><span>費用</span><strong>'+esc(dash(x.fee_summary||'詳見'))+'</strong></div></div><button class="btn" type="button" data-detail="'+esc(x.id)+'">查看詳細</button></article>').join('')+'</div>';
  const b1=document.getElementById('favOnlyBtn'); if(b1) b1.onclick=()=>{state.favOnly=true; syncControls(); render();};
  const b2=document.getElementById('clearFavBtn'); if(b2) b2.onclick=()=>{favorites.clear(); saveFav(); render();};
}
function feeText(x){if(x.is_free) return '免費'; return dash(x.fee_summary||'詳見');}
function titleCell(x,conflictSet){return '<div class="row-title"><div class="row-thumb"><img src="'+courseImage(x)+'" alt="'+esc(x.category)+'"></div><div><div class="row-name">'+esc(x.title)+'</div><div class="row-tags"><span class="pill primary">'+esc(x.category)+'</span><span class="pill">'+esc(x.source_groups.join(' / '))+'</span>'+(x.is_free?'<span class="pill free">免費</span>':'')+(x.has_conflict?'<span class="pill warn">原表有差異</span>':'')+(conflictSet.has(x.id)?'<span class="pill warn">可能撞堂</span>':'')+'</div></div></div>';}
function tdStack(main,sub=''){return '<div class="cell-stack"><div class="cell-main">'+main+'</div>'+(sub?'<div class="cell-sub">'+sub+'</div>':'')+'</div>';}
function desktopRow(x,conflictSet){
  const grades=esc(x.grades.map(g=>gradeNames[g]).join(' · ')||'—');
  const days=esc(x.days.length?x.days.map(d=>dayFull[d]||d).join(' · '):'—');
  const time=nl(dash(x.time_summary||'詳見'));
  const place=esc(dash(x.location_summary||'詳見'));
  const fee=esc(feeText(x));
  return '<tr><td>'+titleCell(x,conflictSet)+'</td><td>'+tdStack(grades)+'</td><td>'+tdStack(days)+'</td><td>'+tdStack(time)+'</td><td>'+tdStack(place)+'</td><td>'+tdStack(fee)+'</td><td><div class="actions"><button class="star '+(favorites.has(x.id)?'on':'')+'" type="button" data-fav="'+esc(x.id)+'" aria-label="'+(favorites.has(x.id)?'取消收藏':'收藏')+'">'+(favorites.has(x.id)?'★':'☆')+'</button><button class="btn" type="button" data-detail="'+esc(x.id)+'">查看</button></div></td></tr>';
}
function mobileCard(x,conflictSet){
  const grades=esc(x.grades.map(g=>gradeNames[g]).join(' · ')||'—');
  const days=esc(x.days.length?x.days.map(d=>dayFull[d]||d).join(' · '):'—');
  const time=nl(dash(x.time_summary||'詳見'));
  const when=days+'<br>'+time;
  return '<article class="panel mobile-card"><div class="mobile-top"><div class="mobile-thumb"><img src="'+courseImage(x)+'" alt="'+esc(x.category)+'"></div><div><div class="mobile-title">'+esc(x.title)+'</div><div class="row-tags"><span class="pill primary">'+esc(x.category)+'</span>'+(x.is_free?'<span class="pill free">免費</span>':'')+(conflictSet.has(x.id)?'<span class="pill warn">可能撞堂</span>':'')+'</div></div><div class="mobile-actions"><button class="star '+(favorites.has(x.id)?'on':'')+'" type="button" data-fav="'+esc(x.id)+'">'+(favorites.has(x.id)?'★':'☆')+'</button></div></div><div class="mobile-essentials"><div class="mobile-info"><label>年級</label><div>'+grades+'</div></div><div class="mobile-info"><label>時間</label><div>'+when+'</div></div><div class="mobile-info"><label>費用</label><div>'+esc(feeText(x))+'</div></div></div><div style="margin-top:9px"><button class="btn" type="button" data-detail="'+esc(x.id)+'">查看詳細</button></div></article>';
}
