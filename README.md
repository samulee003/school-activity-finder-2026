# 2026 小學聯課活動查詢

互動式聯課活動查詢工具，支援搜尋、年級與分類篩選、收藏比較、收藏活動費用總額計算，以及時間衝突提醒。

GitHub Pages: https://samulee003.github.io/school-activity-finder-2026/

## Data files

`data-plain.js` is the canonical browser data asset. `data.js` contains the same
normalized records in gzip form and is used as a fallback when a browser cannot
load the plain asset. The Pages workflow validates that both files contain the
same records before deployment.

The data is normalized by activity: one activity can contain multiple `variants`
when it appears in more than one source table. The current dataset contains 112
activities and 134 source variants.

## Visitor analytics (GoatCounter)

The page loads GoatCounter only when `window.GOATCOUNTER_CODE` is set in
`index.html` (cookieless, free for non-commercial use). To enable:

1. Register at https://www.goatcounter.com (choose the non-commercial free plan).
2. Set your subdomain code in `index.html`: `window.GOATCOUNTER_CODE = 'your-code';`
3. In GoatCounter → Settings → API, create a token.

Pull daily visitor counts (plus trend data and anomaly alerts):

```
node analytics/fetch-visitors.js your-code <token> --days 30          # table + alerts
node analytics/fetch-visitors.js your-code <token> --days 30 --json   # machine-readable
GOATCOUNTER_TOKEN=<token> node analytics/fetch-visitors.js your-code - --days 14 --json > visitors.json
```

`--alert` exits with code 1 when the latest day deviates sharply from the
7-day baseline (spike > 2.5x, drop < 0.5x with baseline ≥ 5) — suitable for a
scheduled job. `--selftest` runs the built-in checks without network access.
