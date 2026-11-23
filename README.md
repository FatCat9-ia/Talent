# Talent Tracking — FATCAT9 Market IQ demo

An industry view of public conversation about talent: who is talked about, whether that conversation drives interest in their titles, and how it varies by studio, market, platform and month.

> **Demo with simulated data.** Talents, studios and titles are real and current; every number, event, post and readout is invented for illustration. Do not present the figures as real.

## What's in the dashboard

- **Filters:** month, country, studio, talent and platform. Every chart and table follows them.
- **Headline KPIs:** posts (with MoM), authors, engagement, engagement per 1K views, talent-pull rate, title association, positive tone and fatigue.
- **Share of conversation** by talent, across all studios.
- **Talent pull vs. title association:** separates talent who drive interest in their title from talent whose fame doesn't transfer.
- **Talent × market heatmap** with a metric picker. Cells below the minimum sample are greyed out.
- **Trend over six months**, with events marked.
- **Platform mix**, **intent** and **tone**.
- **Talent profile**, **market readouts**, **post explorer** and **data-quality** indicators.

Scope of the simulated data: 16 talents across 7 studios (Paramount Skydance, Netflix, HBO, Amazon MGM, Apple TV+, A24 and one multi-studio benchmark), 5 markets (US, MX, UK, BR, FR), 7 platforms and 6 months (May–Oct 2026).

## Run it

It's a static site. It needs a local server only because the page loads JSON files.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

To publish it, turn on **GitHub Pages** for this repository (Settings → Pages → deploy from the `main` branch, root folder).

The current filters are kept in the URL hash, so a filtered view can be shared as a link.

## Structure

```
index.html              page layout and styles
js/dash-shim.js         small runtime: loads the data, runs calculations, redraws on filter changes
js/core.js              calculations (KPIs, share of conversation, heatmap, readouts…) and filters
js/charts.js            charts (d3)
js/tables.js            tables
js/vendor/d3.v7.min.js  d3 v7 (ISC license)
data/                   simulated data (JSON, {rows, meta})
scripts/gen_talent_data.py  generator for the simulated data
assets/                 FATCAT9 logo and Google Sans Flex (SIL OFL 1.1)
```

## Data model

`data/sample_talent_matrix.json` is the core table. It has one row per **month × country × talent × platform**, and every metric is stored as a **count**, not a percentage:

- posts, authors, views, likes, comments, shares
- talent-pull posts
- intent counts
- tone counts
- title-association posts

All rates are computed in the browser from the summed counts. That way they stay correct for any combination of filters.

The other files:

- **Talent context** (`sample_talent_context.json`): top driver, keywords, affinities, event lift and the analyst readout, per talent × country × month.
- **Post sample** (`sample_posts.json`): the auditable post-level layer.
- **Events** (`sample_events.json`): illustrative trailers, premieres and news used to mark the trend.
- **Roster** (`talent_roster.json`): the 16 talents with their studio, title and character.

To regenerate the data:

```bash
python3 scripts/gen_talent_data.py data_out
```

This writes `matrix.json`, `context.json`, `posts.json`, `events.json` and `talents.json`. Copy them into `data/` with the names above.

To plug in real data, export the same columns from the listening platform and replace the files in `data/`. The page doesn't need to change.

## Metric definitions

| Metric | Definition |
|---|---|
| Relevant posts | Public posts kept after relevance, wording-dictionary and noise filtering. |
| Share of conversation | A talent's relevant posts ÷ all monitored talent's posts in the same month, market and platform. |
| Talent-pull rate | Posts saying the performer motivates watching or interest in a title ÷ relevant posts. |
| Title association | Posts that explicitly link the talent to the monitored title or character. |
| Engagement / 1K views | (Likes + comments + shares) ÷ public views × 1,000, only where views are public. |
| Event lift | Change in conversation in an event window vs. baseline. Directional. |

Public data only, monthly delivery, country-level results.
