function amountNumber(raw){const n=Number(String(raw||'').replace(/,/g,'')); return Number.isFinite(n)?n:null;}
function feeAmount(x){
  if(!x||x.is_free) return 0;
  const text=String(x.fee_summary||'').replace(/\s+/g,' ').trim();
  if(!text||/原表未提供|根據.*(?:而定|查詢)|了解詳情|詳見|待定|另行通知/.test(text)) return null;
  if(/免費|不收費|不收取.*費用|免收/.test(text)) return 0;
  const totals=[...text.matchAll(/(?:總費用|总费用|全年總費用|全年度總費用|全學年費用|全年費用|全年度費用|合計|合计|總額|总额|總計|总计)\s*(?:為|为)?\s*[:：]?\s*(?:澳門幣|澳门币|MOP|HK\$|\$)?\s*([\d,]+(?:\.\d+)?)/gi)];
  if(totals.length) return amountNumber(totals[totals.length-1][1]);
  const rate=text.match(/每(?:節|堂)(?:學費|費用)?\s*(?:為|：|:)?\s*(?:澳門幣|澳门币|MOP|HK\$|\$)?\s*([\d,]+(?:\.\d+)?)/i);
  const lessons=text.match(/(?:全年)?上課共\s*(\d+)\s*節/i);
  if(rate&&lessons){
    const rateAmount=amountNumber(rate[1]);
    const lessonCount=Number(lessons[1]);
    if(rateAmount!=null&&Number.isFinite(lessonCount)) return rateAmount*lessonCount;
  }
  const components=[...text.matchAll(/(?:全學年收取(?:材料)?費|全學年(?:材料)?費|材料費|教材費用|制服費|全年度學費|全年學費|全年練習費|活動費用|全學年費用|全年度費用|全年費用)\s*(?:為|：|:)?\s*(?:澳門幣|澳门币|MOP|HK\$|\$)?\s*([\d,]+(?:\.\d+)?)/gi)].map(m=>amountNumber(m[1])).filter(n=>n!=null);
  if(components.length) return components.reduce((sum,n)=>sum+n,0);
  const currencyAmounts=[...text.matchAll(/(?:澳門幣|澳门币|MOP|HK\$|\$)\s*([\d,]+(?:\.\d+)?)/gi)].map(m=>amountNumber(m[1])).filter(n=>n!=null);
  if(currencyAmounts.length===1) return currencyAmounts[0];
  const lone=text.match(/^\s*(?:費用[：:]?\s*)?([\d,]+(?:\.\d+)?)\s*(?:元)?\s*$/i);
  return lone?amountNumber(lone[1]):null;
}
function formatFeeAmount(amount){return 'MOP '+Number(amount||0).toLocaleString('en-US',{maximumFractionDigits:2});}
function renderCompare(){
  const fav=[...favorites].map(id=>DATA.find(x=>x.id===id)).filter(Boolean);
  if(!fav.length){
    el.favoritesPanel.innerHTML='<div class="compare-emptybar"><img src="'+imageFor('cards')+'" alt=""><div><strong>⭐ 收藏 0</strong><span>按星號加入比較</span></div></div>';
    return;
  }
  const free=fav.filter(x=>x.is_free).length, paid=fav.length-free, conflicts=findConflicts(fav), conflictSet=favoriteConflictSet();
  const amounts=fav.map(feeAmount), unknownFees=amounts.filter(n=>n==null).length, knownTotal=amounts.reduce((sum,n)=>sum+(n==null?0:n),0);
  const totalBadge='<span class="badge amount-badge">💰 <strong>'+esc(formatFeeAmount(knownTotal))+'</strong> '+(unknownFees?'已知金額':'預計總額')+'</span>';
  const unknownBadge=unknownFees?'<span class="badge pending-badge">⚠️ <strong>'+unknownFees+'</strong> 項費用待查</span>':'';
  el.favoritesPanel.innerHTML='<div class="compare-head"><div><h3>收藏比較</h3><p>已加入 '+fav.length+' 個活動</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn-soft" id="favOnlyBtn" type="button">只看收藏</button><button class="btn-soft" id="clearFavBtn" type="button">清空收藏</button></div></div><div class="badges"><span class="badge">⭐ <strong>'+fav.length+'</strong> 個收藏</span><span class="badge">💸 <strong>'+free+'</strong> 個免費</span><span class="badge">🧾 <strong>'+paid+'</strong> 個收費</span>'+totalBadge+unknownBadge+(state.grade!=='all'?'<span class="badge">🎒 <strong>'+gradeNames[Number(state.grade)]+'</strong></span>':'')+'</div>'+(conflicts.length?'<div class="conflicts"><div><h4>時間衝突</h4><ul>'+conflicts.map(c=>'<li>'+esc(c.a.title)+' × '+esc(c.b.title)+'：'+esc(dayFull[c.day]||c.day)+' 時段重疊</li>').join('')+'</ul></div><img src="'+imageFor('calendar')+'" alt="時間提醒插圖"></div>':'')+'<div class="compare-grid">'+fav.map(x=>'<article class="compare-card"><div class="compare-title"><img src="'+courseImage(x)+'" alt="'+esc(x.category)+'"><div><h4>'+esc(x.title)+'</h4><div class="compare-tags"><span class="mini-tag">'+esc(x.category)+'</span>'+(conflictSet.has(x.id)?'<span class="mini-tag" style="background:var(--danger-soft);color:var(--danger)">可能撞堂</span>':'')+'</div></div><button class="btn" type="button" data-fav="'+esc(x.id)+'">移除</button></div><div class="compare-meta"><div class="compare-row"><span>年級</span><strong>'+esc(x.grades.map(g=>gradeNames[g]).join(' · '))+'</strong></div><div class="compare-row"><span>時間</span><strong>'+nl(dash(x.time_summary||'詳見'))+'</strong></div><div class="compare-row"><span>地點</span><strong>'+esc(dash(x.location_summary||'詳見'))+'</strong></div><div class="compare-row"><span>費用</span><strong>'+esc(dash(x.fee_summary||'詳見'))+'</strong></div></div><button class="btn" type="button" data-detail="'+esc(x.id)+'">查看詳細</button></article>').join('')+'</div>';
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
  return '<article class="panel mobile-card"><div class="mobile-top"><div class="mobile-thumb"><img src="'+courseImage(x)+'" alt="'+esc(x.category)+'"></div><div><div class="mobile-title" data-detail="'+esc(x.id)+'" role="button">'+esc(x.title)+'</div><div class="row-tags"><span class="pill primary">'+esc(x.category)+'</span>'+(x.is_free?'<span class="pill free">免費</span>':'')+(conflictSet.has(x.id)?'<span class="pill warn">可能撞堂</span>':'')+'</div></div><div class="mobile-actions"><button class="star '+(favorites.has(x.id)?'on':'')+'" type="button" data-fav="'+esc(x.id)+'" aria-label="'+(favorites.has(x.id)?'取消收藏':'收藏')+'">'+(favorites.has(x.id)?'★':'☆')+'</button></div></div><div class="mobile-essentials"><div class="mobile-info"><label>年級</label><div>'+grades+'</div></div><div class="mobile-info"><label>時間</label><div>'+when+'</div></div><div class="mobile-info"><label>費用</label><div>'+esc(feeText(x))+'</div></div></div><div style="margin-top:9px"><button class="btn" type="button" data-detail="'+esc(x.id)+'">查看詳細</button></div></article>';
}
