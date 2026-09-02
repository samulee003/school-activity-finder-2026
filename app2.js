function parseDateCoverageText(raw){
  const text=String(raw||'').replace(/\s+/g,' ').trim();
  const dates=new Set(), ranges=[];
  if(!text) return {dates,ranges};
  const explicitYearRange=text.match(/2026年\s*(\d{1,2})月\s*至\s*2027年\s*(\d{1,2})月/);
  if(explicitYearRange){ranges.push(['2026-'+pad2(explicitYearRange[1])+'-01','2027-'+pad2(explicitYearRange[2])+'-31']); return {dates,ranges};}
  const start=text.match(/(\d{1,2})月\s*(\d{1,2})日?(?:起)?(?:開始上課|開始)/);
  const finish=text.match(/(\d{1,2})月\s*(\d{1,2})日?(?:最後上課(?:日)?|最後上課日)/);
  if(start){
    const s=dateKey(start[1],start[2]);
    let e=finish?dateKey(finish[1],finish[2]):null;
    if(!e) e='2027-08-31';
    if(s) ranges.push([s,e]);
    return {dates,ranges};
  }
  const monthMatches=[...text.matchAll(/(\d{1,2})月\s*[:：]?/g)];
  for(let i=0;i<monthMatches.length;i++){
    const month=Number(monthMatches[i][1]);
    const segStart=monthMatches[i].index+monthMatches[i][0].length;
    const segEnd=i+1<monthMatches.length?monthMatches[i+1].index:text.length;
    const segment=text.slice(segStart,segEnd);
    const days=[...segment.matchAll(/(\d{1,2})(?:日)?/g)].map(m=>Number(m[1])).filter(d=>d>=1&&d<=31);
    days.forEach(d=>{const k=dateKey(month,d); if(k) dates.add(k);});
  }
  for(const m of text.matchAll(/(\d{1,2})\s*\/\s*(\d{1,2})/g)){
    const day=Number(m[1]), month=Number(m[2]);
    const k=dateKey(month,day); if(k) dates.add(k);
  }
  return {dates,ranges};
}
function courseCoverage(course){
  if(coverageCache.has(course.id)) return coverageCache.get(course.id);
  const dates=new Set(),ranges=[];
  (course.variants||[]).forEach(v=>{
    const c=parseDateCoverageText(v.dates);
    c.dates.forEach(d=>dates.add(d));
    c.ranges.forEach(r=>ranges.push(r));
  });
  const out={dates,ranges,known:dates.size>0||ranges.length>0};
  coverageCache.set(course.id,out); return out;
}
function dateInRange(date,range){return date>=range[0]&&date<=range[1];}
function coverageOverlap(a,b){
  const A=courseCoverage(a),B=courseCoverage(b);
  if(!A.known||!B.known) return true;
  if(A.dates.size&&B.dates.size){for(const d of A.dates) if(B.dates.has(d)) return true;}
  if(A.dates.size&&B.ranges.length){for(const d of A.dates) for(const r of B.ranges) if(dateInRange(d,r)) return true;}
  if(B.dates.size&&A.ranges.length){for(const d of B.dates) for(const r of A.ranges) if(dateInRange(d,r)) return true;}
  if(A.ranges.length&&B.ranges.length){for(const ra of A.ranges) for(const rb of B.ranges) if(ra[0]<=rb[1]&&rb[0]<=ra[1]) return true;}
  return false;
}
function findConflicts(list){
  const items=list.map(c=>({course:c,slots:parseSlots(c)})); const out=[];
  for(let i=0;i<items.length;i++) for(let j=i+1;j<items.length;j++){
    if(!coverageOverlap(items[i].course,items[j].course)) continue;
    let found=false;
    for(const s1 of items[i].slots){for(const s2 of items[j].slots){
      if(s1.day===s2.day&&s1.day!=='?'&&overlaps(s1,s2)){out.push({a:items[i].course,b:items[j].course,day:s1.day}); found=true; break;}
    } if(found) break;}
  }
  return out;
}
function favoriteConflictSet(){const fav=[...favorites].map(id=>DATA.find(x=>x.id===id)).filter(Boolean); const set=new Set(); findConflicts(fav).forEach(c=>{set.add(c.a.id); set.add(c.b.id);}); return set;}
function courseImage(x){const matched=GROUPS.find(g=>g.cats && g.cats.includes(x.category)); return matched ? matched.image : IMAGE_MAP.doc;}
