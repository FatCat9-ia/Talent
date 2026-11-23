// Shared helpers, filters and the calculations behind every number on the page.
(function () {
  // Fixed reference: a talent x market cell needs at least this many relevant posts to be reported.
  const MIN_SAMPLE = 100;
  const COUNTS = ['posts', 'authors', 'views', 'posts_with_views', 'likes', 'comments', 'shares', 'engagement',
    'country_attributed', 'pull_posts', 'wants_to_watch', 'recommends', 'fan_advocacy', 'fatigue', 'other_intent',
    'positive', 'neutral', 'negative', 'title_assoc'];
  const r1 = (x) => (x == null || !isFinite(x) ? null : Math.round(x * 10) / 10);
  function sum(rows) {
    const o = {};
    COUNTS.forEach((k) => { o[k] = 0; });
    for (const r of rows) for (const k of COUNTS) o[k] += +r[k] || 0;
    return o;
  }
  // Rates are always recomputed from summed counts, so they stay right for any filter combination.
  function rates(o) {
    const n = o.posts;
    const pct = (x) => (n ? r1((x / n) * 100) : null);
    return Object.assign({}, o, {
      eng_1k: o.views ? r1((o.engagement / o.views) * 1000) : null,
      view_cov: pct(o.posts_with_views), attribution: pct(o.country_attributed),
      pull_rate: pct(o.pull_posts), title_pct: pct(o.title_assoc),
      wants_pct: pct(o.wants_to_watch), rec_pct: pct(o.recommends), fan_pct: pct(o.fan_advocacy),
      fatigue_pct: pct(o.fatigue), other_pct: pct(o.other_intent),
      pos_pct: pct(o.positive), neu_pct: pct(o.neutral), neg_pct: pct(o.negative),
    });
  }
  function prevMonth(m) {
    if (!m) return '';
    const [y, mo] = m.split('-').map(Number);
    return new Date(Date.UTC(y, mo - 2, 1)).toISOString().slice(0, 7);
  }
  // Does a row pass the page filters? Dimensions named in `skip` are ignored.
  function keep(r, p, skip) {
    skip = skip || [];
    return ['country', 'talent', 'platform', 'studio'].every((d) => skip.includes(d) || !p[d] || r[d] === p[d]);
  }
  const monthLabel = (m) => (m ? d3.utcFormat('%b %Y')(new Date(m + '-01T00:00:00Z')) : '');
  const COUNTRY = { US: 'United States', MX: 'Mexico', UK: 'United Kingdom', BR: 'Brazil', FR: 'France' };
  const fmt = {
    int: (v) => (v == null ? '—' : d3.format(',')(v)),
    pct: (v) => (v == null ? '—' : v.toFixed(1) + '%'),
    one: (v) => (v == null ? '—' : v.toFixed(1)),
    signed: (v) => (v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%'),
    text: (v) => (v == null || v === '' ? '—' : String(v)),
  };
  // A tooltip kept inside a chart's own drawing.
  function tip(el) {
    el.style.position = 'relative';
    const t = document.createElement('div');
    t.className = 'tt-tip';
    t.hidden = true;
    el.appendChild(t);
    return {
      show(e, lines) {
        t.replaceChildren(...lines.map((l, i) => { const d = document.createElement('div'); if (i === 0) d.className = 'tt-tip-h'; d.textContent = l; return d; }));
        t.hidden = false;
        const b = el.getBoundingClientRect();
        let x = e.clientX - b.left + 14; const y = e.clientY - b.top + 14;
        if (x + t.offsetWidth > b.width) x = Math.max(0, e.clientX - b.left - t.offsetWidth - 14);
        t.style.left = x + 'px'; t.style.top = y + 'px';
      },
      hide() { t.hidden = true; },
    };
  }
  // Shows a load state in a chart's place; returns true when the data is ready.
  function ready(el, d, emptyText) {
    if (d.status === 'ok' && d.data && d.data.length) return true;
    const p = document.createElement('p');
    p.className = 'tt-note';
    p.textContent = d.status === 'error' ? 'This part failed to load.' : d.status === 'ok' ? (emptyText || 'No conversation matches these filters.') : '—';
    el.replaceChildren(p);
    return false;
  }
  // A marked number inside a sentence.
  function mark(text, source, field, where) {
    const s = document.createElement('b');
    s.textContent = text;
    s.dataset.source = source; s.dataset.field = field;
    if (where) s.dataset.where = where;
    return s;
  }
  const enc = (v) => encodeURIComponent(v);
  // FatCat9 pinks: main, light, deep, plum, mid
  const P = ['#D6247E', '#F4A6CB', '#9C1A63', '#5E0A3C', '#E86AA6'];
  window.TT = { MIN_SAMPLE, sum, rates, prevMonth, keep, monthLabel, COUNTRY, fmt, tip, ready, mark, enc, r1, P };
})();

// ---------- Calculations ----------
dash.calc('kpis', {
  inputs: ['matrix'],
  title: 'Headline KPIs',
  description: 'Sums the monthly matrix for the selected month, market, talent, platform and studio. Rates are recomputed from the summed counts; MoM compares relevant posts with the previous month.',
  fn: (matrix) => {
    const p = dash.params();
    const cur = TT.rates(TT.sum(matrix.filter((r) => r.period === p.month && TT.keep(r, p))));
    const prev = TT.sum(matrix.filter((r) => r.period === TT.prevMonth(p.month) && TT.keep(r, p)));
    return [{
      posts: cur.posts, posts_prev: prev.posts, mom: prev.posts ? TT.r1((cur.posts / prev.posts - 1) * 100) : null,
      authors: cur.authors, engagement: cur.engagement, eng_1k: cur.eng_1k, pull_rate: cur.pull_rate,
      title_pct: cur.title_pct, pos_pct: cur.pos_pct, neg_pct: cur.neg_pct, fatigue_pct: cur.fatigue_pct,
    }];
  },
});

dash.calc('by_talent', {
  inputs: ['matrix'],
  title: 'Metrics by talent',
  description: 'One row per talent for the selected month, market and platform. Share of conversation divides by all monitored talent (every studio) in the same scope.',
  fn: (matrix) => {
    const p = dash.params();
    const scope = (m) => matrix.filter((r) => r.period === m && TT.keep(r, p, ['talent', 'studio']));
    const cur = scope(p.month);
    const total = d3.sum(cur, (r) => r.posts);
    const prev = d3.rollup(scope(TT.prevMonth(p.month)), (v) => d3.sum(v, (r) => r.posts), (r) => r.talent);
    return d3.groups(cur.filter((r) => !p.studio || r.studio === p.studio), (r) => r.talent).map(([talent, rows]) => {
      const a = TT.rates(TT.sum(rows));
      const pv = prev.get(talent);
      return {
        talent, studio: rows[0].studio, title: rows[0].title, posts: a.posts,
        soc: total ? TT.r1((a.posts / total) * 100) : null, mom: pv ? TT.r1((a.posts / pv - 1) * 100) : null,
        pull_rate: a.pull_rate, title_pct: a.title_pct, eng_1k: a.eng_1k,
        wants_pct: a.wants_pct, rec_pct: a.rec_pct, fan_pct: a.fan_pct, fatigue_pct: a.fatigue_pct, other_pct: a.other_pct,
        pos_pct: a.pos_pct, neu_pct: a.neu_pct, neg_pct: a.neg_pct,
      };
    }).sort((a, b) => b.posts - a.posts);
  },
});

dash.calc('heatmap', {
  inputs: ['matrix'],
  title: 'Talent × market metrics',
  description: 'One row per talent and country for the selected month, platform and studio. Share of conversation is within each country.',
  fn: (matrix) => {
    const p = dash.params();
    const scope = (m) => matrix.filter((r) => r.period === m && TT.keep(r, p, ['talent', 'studio', 'country']));
    const cur = scope(p.month);
    const totals = d3.rollup(cur, (v) => d3.sum(v, (r) => r.posts), (r) => r.country);
    const prev = d3.rollup(scope(TT.prevMonth(p.month)), (v) => d3.sum(v, (r) => r.posts), (r) => r.talent, (r) => r.country);
    const out = [];
    for (const [talent, byC] of d3.group(cur.filter((r) => !p.studio || r.studio === p.studio), (r) => r.talent, (r) => r.country)) {
      for (const [country, rows] of byC) {
        const a = TT.rates(TT.sum(rows));
        const pv = prev.get(talent) && prev.get(talent).get(country);
        out.push({
          talent, country, studio: rows[0].studio, posts: a.posts,
          soc: TT.r1((a.posts / totals.get(country)) * 100), mom: pv ? TT.r1((a.posts / pv - 1) * 100) : null,
          pull_rate: a.pull_rate, title_pct: a.title_pct, pos_pct: a.pos_pct, fatigue_pct: a.fatigue_pct, eng_1k: a.eng_1k,
          low_sample: a.posts < TT.MIN_SAMPLE,
        });
      }
    }
    return out;
  },
});

dash.calc('trend', {
  inputs: ['matrix'],
  title: 'Monthly posts by talent',
  description: 'Relevant posts per talent and month for the selected market, talent, platform and studio.',
  fn: (matrix) => {
    const p = dash.params();
    const rows = matrix.filter((r) => TT.keep(r, p));
    return d3.flatRollup(rows, (v) => d3.sum(v, (r) => r.posts), (r) => r.talent, (r) => r.period, (r) => r.studio)
      .map(([talent, period, studio, posts]) => ({ talent, period, studio, posts }))
      .sort((a, b) => d3.ascending(a.period, b.period));
  },
});

dash.calc('by_platform', {
  inputs: ['matrix'],
  title: 'Metrics by platform',
  description: 'One row per platform for the selected month, market, talent and studio.',
  fn: (matrix) => {
    const p = dash.params();
    const cur = matrix.filter((r) => r.period === p.month && TT.keep(r, p, ['platform']));
    const total = d3.sum(cur, (r) => r.posts);
    return d3.groups(cur, (r) => r.platform).map(([platform, rows]) => {
      const a = TT.rates(TT.sum(rows));
      return {
        platform, posts: a.posts, share: total ? TT.r1((a.posts / total) * 100) : null, eng_1k: a.eng_1k,
        pull_rate: a.pull_rate, title_pct: a.title_pct, pos_pct: a.pos_pct, neg_pct: a.neg_pct, view_cov: a.view_cov,
      };
    }).sort((a, b) => b.posts - a.posts);
  },
});

dash.calc('markets', {
  inputs: ['matrix', 'context'],
  title: 'Market readouts',
  description: 'One row per talent and country with the month’s metrics (all filters applied) joined to the analyst context: driver, event lift and readout.',
  fn: (matrix, context) => {
    const p = dash.params();
    const scope = (m) => matrix.filter((r) => r.period === m && TT.keep(r, p, ['talent', 'studio']));
    const cur = scope(p.month);
    const totals = d3.rollup(cur, (v) => d3.sum(v, (r) => r.posts), (r) => r.country);
    const prev = d3.rollup(scope(TT.prevMonth(p.month)), (v) => d3.sum(v, (r) => r.posts), (r) => r.talent, (r) => r.country);
    const ctx = new Map(context.filter((c) => c.period === p.month).map((c) => [c.talent + '|' + c.country, c]));
    const out = [];
    for (const [talent, byC] of d3.group(cur.filter((r) => TT.keep(r, p, ['country', 'platform'])), (r) => r.talent, (r) => r.country)) {
      for (const [country, rows] of byC) {
        const a = TT.rates(TT.sum(rows));
        const pv = prev.get(talent) && prev.get(talent).get(country);
        const c = ctx.get(talent + '|' + country) || {};
        out.push({
          talent, country, studio: rows[0].studio, posts: a.posts, soc: TT.r1((a.posts / totals.get(country)) * 100),
          mom: pv ? TT.r1((a.posts / pv - 1) * 100) : null, pull_rate: a.pull_rate, title_pct: a.title_pct,
          pos_pct: a.pos_pct, fatigue_pct: a.fatigue_pct, top_driver: c.top_driver || null,
          event: c.event || null, event_response: c.event_response == null ? null : c.event_response,
          sample: a.posts < TT.MIN_SAMPLE ? 'Low sample' : 'Sufficient', readout: c.readout || null,
        });
      }
    }
    return out.sort((a, b) => d3.ascending(a.country, b.country) || b.posts - a.posts);
  },
});

dash.calc('posts_view', {
  inputs: ['posts'],
  title: 'Top sample posts',
  description: 'The 25 posts with the most engagement in the post-level sample for the current filters.',
  fn: (posts) => {
    const p = dash.params();
    return posts.filter((r) => r.period === p.month && TT.keep(r, p))
      .sort((a, b) => (b.engagement || 0) - (a.engagement || 0)).slice(0, 25);
  },
});

dash.calc('posts_summary', {
  inputs: ['posts'],
  title: 'Post sample summary',
  description: 'How many sample posts match the current filters, and the share reviewed by an analyst.',
  fn: (posts) => {
    const p = dash.params();
    const rows = posts.filter((r) => r.period === p.month && TT.keep(r, p));
    const v = rows.filter((r) => r.human_validated === 'Yes').length;
    return [{ matched: rows.length, validated_pct: rows.length ? TT.r1((v / rows.length) * 100) : null }];
  },
});

dash.calc('quality', {
  inputs: ['matrix'],
  title: 'Data quality',
  description: 'View-data coverage and country attribution for the current filters, and how many talent × market cells fall under the minimum sample.',
  fn: (matrix) => {
    const p = dash.params();
    const cur = matrix.filter((r) => r.period === p.month && TT.keep(r, p));
    const a = TT.rates(TT.sum(cur));
    const cells = d3.rollups(cur, (v) => d3.sum(v, (r) => r.posts), (r) => r.talent + '|' + r.country);
    return [{ view_cov: a.view_cov, attribution: a.attribution, cells: cells.length, low_cells: cells.filter(([, n]) => n < TT.MIN_SAMPLE).length }];
  },
});

dash.calc('profile', {
  inputs: ['talents', 'context'],
  title: 'Talent profile',
  description: 'Roster details and the month’s qualitative context for the selected talent (selected market, or every market).',
  fn: (talents, context) => {
    const p = dash.params();
    const t = talents.find((x) => x.talent === p.talent);
    if (!t) return [];
    const ctx = context.filter((c) => c.talent === p.talent && c.period === p.month && (!p.country || c.country === p.country));
    const top = (k) => { const g = d3.rollups(ctx.filter((c) => c[k]), (v) => v.length, (c) => c[k]).sort((a, b) => b[1] - a[1]); return g.length ? g[0][0] : null; };
    return [{
      talent: t.talent, studio: t.studio, title_character: t.title + ' / ' + t.character,
      top_driver: top('top_driver'), event: top('event') || 'No tracked event',
      keywords: ctx[0] ? ctx[0].keywords : null, affinities: ctx[0] ? ctx[0].affinities : null,
    }];
  },
});

// ---------- Filters ----------
dash.draw('f_month', (sel) => {
  const d = dash.data('matrix');
  const months = d.status === 'ok' ? Array.from(new Set(d.data.map((r) => r.period))).sort().reverse() : [];
  if (!months.length) { sel.replaceChildren(new Option('—', '')); return; }
  sel.replaceChildren(...months.map((m) => new Option(TT.monthLabel(m), m)));
  sel.value = dash.params().month || months[0];
  sel.onchange = () => dash.setParams({ month: sel.value });
});
dash.draw('f_talent', (sel) => {
  const d = dash.data('talents');
  const rows = d.status === 'ok' ? d.data : [];
  const opt = (r) => new Option(r.talent, r.talent);
  const grp = (label, list) => { const g = document.createElement('optgroup'); g.label = label; g.append(...list.map(opt)); return g; };
  const studios = Array.from(new Set(rows.map((r) => r.studio))).sort();
  sel.replaceChildren(new Option('All talent', ''), ...studios.map((s) => grp(s, rows.filter((r) => r.studio === s))));
  sel.value = dash.params().talent || '';
  sel.onchange = () => dash.setParams({ talent: sel.value });
});
dash.draw('f_summary', (el) => {
  const p = dash.params();
  const parts = [TT.monthLabel(p.month), p.country ? TT.COUNTRY[p.country] : 'All markets', p.talent || 'All talent',
    p.platform || 'All platforms', p.studio || 'All studios'];
  el.textContent = 'Showing: ' + parts.join(' · ');
});
dash.draw('min_sample', (el) => { el.textContent = String(TT.MIN_SAMPLE); });

(function () {
  const bind = (id, name) => document.querySelectorAll('#' + id).forEach((el) => {
    el.addEventListener('change', () => dash.setParams({ [name]: el.value }));
  });
  bind('f-country', 'country'); bind('f-platform', 'platform'); bind('f-studio', 'studio'); bind('hm-metric', 'hm');
  document.querySelectorAll('#f-reset').forEach((b) => b.addEventListener('click', () => dash.resetParams()));
  dash.onData(() => {
    const p = dash.params();
    [['f-country', 'country'], ['f-platform', 'platform'], ['f-studio', 'studio'], ['hm-metric', 'hm']].forEach(([id, k]) => {
      document.querySelectorAll('#' + id).forEach((el) => { if (document.activeElement !== el) el.value = p[k] || (k === 'hm' ? 'soc' : ''); });
    });
    document.querySelectorAll('#profile').forEach((el) => { el.hidden = !p.talent; });
    document.querySelectorAll('#profile-hint').forEach((el) => { el.hidden = !!p.talent; });
  });
})();

// ---------- Single values (KPI tiles, profile fields, quality) ----------
dash.draw('val', (el) => {
  const d = dash.data(el.dataset.source);
  el.classList.toggle('dash-skeleton', d.status === 'loading');
  const row = d.status === 'ok' && d.data && d.data[0];
  if (!row) { el.textContent = d.status === 'error' ? 'Failed' : '—'; return; }
  const v = row[el.dataset.field];
  el.textContent = TT.fmt[el.dataset.fmt || 'text'](v);
  if (el.dataset.good) {
    el.classList.toggle('tt-good', v != null && v > 0);
    el.classList.toggle('tt-bad', v != null && v < 0);
  }
});

dash.draw('takeaway', (el) => {
  const d = dash.data('by_talent');
  if (d.status !== 'ok' || !d.data.length) { el.textContent = d.status === 'ok' ? 'No conversation matches these filters.' : '—'; return; }
  const p = dash.params();
  const rows = d.data;
  const w = (r) => 'talent=' + TT.enc(r.talent);
  const lead = rows.reduce((a, b) => (b.soc > a.soc ? b : a));
  const pull = rows.reduce((a, b) => (b.pull_rate > a.pull_rate ? b : a));
  const scope = (p.country ? 'in ' + TT.COUNTRY[p.country] : 'across all markets') + (p.platform ? ' on ' + p.platform : '');
  const parts = ['In ' + TT.monthLabel(p.month) + ' ' + scope + ', ', TT.mark(lead.talent, 'by_talent', 'talent', w(lead)),
    ' leads share of conversation with ', TT.mark(TT.fmt.pct(lead.soc), 'by_talent', 'soc', w(lead))];
  if (rows.length > 1) {
    parts.push(pull === lead ? ' and also has the highest talent-pull rate (' : '. ', ...(pull === lead ? [] : [TT.mark(pull.talent, 'by_talent', 'talent', w(pull)), ' has the highest talent-pull rate (']),
      TT.mark(TT.fmt.pct(pull.pull_rate), 'by_talent', 'pull_rate', w(pull)), ')');
  }
  const best = rows.filter((r) => r.title !== 'Multiple titles').reduce((a, b) => (b.title_pct > a.title_pct ? b : a), { title_pct: -1 });
  if (best.talent) {
    parts.push('. Strongest title transfer: ', TT.mark(best.talent, 'by_talent', 'talent', w(best)),
      ' (' + best.studio + '), with ', TT.mark(TT.fmt.pct(best.title_pct), 'by_talent', 'title_pct', w(best)), ' of conversation tied to ' + best.title + '.');
  } else parts.push('.');
  el.replaceChildren(...parts);
});
