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
