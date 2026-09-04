#!/usr/bin/env node
/**
 * GoatCounter 每日訪客數拉取 ＋ 異動提醒
 *
 * 用法：
 *   node analytics/fetch-visitors.js <code> <token> [--days N] [--json] [--alert]
 *     <code>   你的 GoatCounter 子網域（https://<code>.goatcounter.com）
 *     <token>  API token（GoatCounter 後台 → Settings → API → Create token）
 *              也可用環境變數 GOATCOUNTER_TOKEN 傳入，避免留在指令歷史
 *     --days N 拉最近 N 天（預設 30，API 單次上限一個月，腳本會自動分段）
 *     --json   輸出機器可讀 JSON（供趨勢圖用）
 *     --alert  只在偵測到異動時以 exit code 1 回報（接排程/通知用）
 *
 * 範例：
 *   GOATCOUNTER_TOKEN=xxxx node analytics/fetch-visitors.js puiching-eca - --days 14
 *   node analytics/fetch-visitors.js puiching-eca xxxx --days 30 --json
 *
 * 異動規則：最近一天訪客數 > 7 日均值的 2.5 倍（爆量）或 < 0.5 倍且均值 ≥ 5（異常掉落）
 */
'use strict';

const BASE = (code) => `https://${code}.goatcounter.com/api/v0`;

function parseArgs(argv) {
  const args = { days: 30, json: false, alert: false, positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--days') args.days = Number(argv[++i]);
    else if (a === '--json') args.json = true;
    else if (a === '--alert') args.alert = true;
    else if (a === '--selftest') args.selftest = true;
    else args.positional.push(a);
  }
  return args;
}

function buildRanges(days) {
  // API 單次查詢上限約一個月：切成 ≤31 天的區段，由舊到新
  const ranges = [];
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  let cursor = new Date(end);
  cursor.setUTCDate(cursor.getUTCDate() - (days - 1));
  while (cursor <= end) {
    const segEnd = new Date(cursor);
    segEnd.setUTCDate(segEnd.getUTCDate() + 30);
    if (segEnd > end) segEnd.setTime(end.getTime());
    ranges.push({ start: iso(cursor), end: iso(segEnd) });
    cursor = new Date(segEnd);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return ranges;
}
const iso = (d) => d.toISOString().slice(0, 10);

async function fetchStats(code, token, days) {
  let all = [];
  for (const { start, end } of buildRanges(days)) {
    const url = `${BASE(code)}/stats/total?start=${start}&end=${end}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${start}..${end} — ${(await res.text()).slice(0, 200)}`);
    const body = await res.json();
    if (!Array.isArray(body.stats)) throw new Error(`unexpected response for ${start}..${end}: ${JSON.stringify(body).slice(0, 200)}`);
    all = all.concat(body.stats);
    await new Promise((r) => setTimeout(r, 600)); // API 限速約 4 req/s，保守一點
  }
  return all;
}

function summarize(stats) {
  const series = stats
    .map((s) => ({ date: s.day, visits: Number(s.daily) || 0 }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const totals = { visits: series.reduce((a, s) => a + s.visits, 0) };
  return { series, totals };
}

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function detectAnomalies(series, lookback = 7) {
  const alerts = [];
  for (let i = lookback; i < series.length; i++) {
    const base = mean(series.slice(i - lookback, i).map((s) => s.visits));
    const today = series[i].visits;
    if (base >= 2 && today > base * 2.5) alerts.push({ date: series[i].date, type: 'spike', today, baseline: +base.toFixed(1), message: `訪客爆量：${today} ≈ ${lookback}日均值(${base.toFixed(1)}) 的 ${(today / base).toFixed(1)} 倍` });
    else if (base >= 5 && today < base * 0.5) alerts.push({ date: series[i].date, type: 'drop', today, baseline: +base.toFixed(1), message: `訪客異常掉落：${today} 僅為 ${lookback}日均值(${base.toFixed(1)}) 的 ${(today / base).toFixed(2)} 倍` });
  }
  return alerts;
}

function selftest() {
  const mk = (arr) => arr.map((v, i) => ({ day: `2026-01-${String(i + 1).padStart(2, '0')}`, daily: v, hourly: [] }));
  const assert = (cond, msg) => { if (!cond) { console.error('SELFTEST FAIL:', msg); process.exit(1); } console.log('ok —', msg); };
  const s1 = summarize(mk([1, 2, 3]));
  assert(s1.totals.visits === 6 && s1.series[0].date === '2026-01-01', 'summarize totals + ordering');
  assert(buildRanges(75).length === 3, '75 days chunks into 3 ranges');
  assert(buildRanges(1).length === 1 && buildRanges(1)[0].start === buildRanges(1)[0].end, 'single day range');
  const spike = detectAnomalies(summarize(mk([5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 40])).series);
  assert(spike.length === 1 && spike[0].type === 'spike' && spike[0].today === 40, 'spike detected');
  const drop = detectAnomalies(summarize(mk([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1])).series);
  assert(drop.length === 1 && drop[0].type === 'drop', 'drop detected');
  const quiet = detectAnomalies(mk([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2]));
  assert(quiet.length === 0, 'small numbers do not alert');
  console.log('SELFTEST PASS');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.selftest) { selftest(); return; }
  const [code, tokenArg] = args.positional;
  const token = tokenArg && tokenArg !== '-' ? tokenArg : process.env.GOATCOUNTER_TOKEN;
  if (!code || !token) {
    console.error('缺少參數');
    console.error('用法: node analytics/fetch-visitors.js <code> <token> [--days N] [--json] [--alert]');
    process.exit(2);
  }
  const stats = await fetchStats(code, token, args.days);
  const { series, totals } = summarize(stats);
  const alerts = detectAnomalies(series);

  if (args.json) {
    console.log(JSON.stringify({ code, days: args.days, totals, series, alerts, fetchedAt: new Date().toISOString() }, null, 2));
  } else {
    console.log(`\n${code}.goatcounter.com — 最近 ${series.length} 天`);
    console.log('日期        訪客');
    for (const s of series) console.log(`${s.date}  ${String(s.visits).padStart(4)}`);
    console.log(`合計        ${String(totals.visits).padStart(4)}`);
    if (alerts.length) {
      console.log('\n⚠️ 異動提醒：');
      alerts.forEach((a) => console.log(`  [${a.type}] ${a.date}: ${a.message}`));
    } else {
      console.log('\n✓ 無異動');
    }
  }
  if (args.alert && alerts.length) process.exit(1);
}

main().catch((e) => { console.error('FAIL:', e.message); process.exit(2); });
