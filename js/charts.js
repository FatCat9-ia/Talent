// Charts. Each one is a drawing that replaces its own contents on every call.
const PINK = TT.P[0], DEEP = TT.P[2], PLUM = TT.P[3];
const toggleTalent = (name) => { const p = dash.params(); dash.setParams({ talent: p.talent === name ? '' : name }); };
const textW = (svg, s, cls) => {
  const t = svg.append('text').attr('class', cls || '').attr('x', -9999).text(s);
  const w = t.node().getComputedTextLength(); t.remove(); return w;
};
const short = (n) => (n === 'Zendaya' ? n : n.split(' ').slice(-1)[0]);
// one soft pink gradient per svg, for bars
function gradient(svg, id) {
  const g = svg.append('defs').append('linearGradient').attr('id', id).attr('x1', '0').attr('x2', '1');
  g.append('stop').attr('offset', '0').attr('stop-color', PINK);
  g.append('stop').attr('offset', '1').attr('stop-color', DEEP);
  return `url(#${id})`;
}

// ---- Share of conversation: ranked bars on rounded tracks ----
dash.draw('soc_chart', (el) => {
  const d = dash.data('by_talent');
  if (!TT.ready(el, d)) return;
  const p = dash.params();
  const rows = d.data.slice().sort((a, b) => b.soc - a.soc);
  const W = Math.max(280, el.clientWidth || 600), rowH = 30, H = rows.length * rowH + 4;
  el.replaceChildren();
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`)
    .attr('role', 'img').attr('aria-label', 'Share of conversation by talent, bar chart');
  const fill = PINK;
  const labelW = Math.min(W * 0.4, d3.max(rows, (r) => textW(svg, r.talent, 'tt-name')) + 12);
  const valW = d3.max(rows, (r) => textW(svg, TT.fmt.pct(r.soc), 'tt-val')) + 10;
  const studioW = W < 520 ? 0 : d3.max(rows, (r) => textW(svg, r.studio)) + 12;
  const trackW = W - labelW - valW - studioW;
  const x = d3.scaleLinear([0, d3.max(rows, (r) => r.soc) || 1], [0, trackW]);
  const tip = TT.tip(el);
  const g = svg.selectAll('g.row').data(rows).join('g').attr('class', 'row tt-click')
    .attr('transform', (r, i) => `translate(0,${i * rowH + 2})`)
    .style('opacity', (r) => (p.talent && r.talent !== p.talent ? 0.3 : 1))
    .on('click', (e, r) => toggleTalent(r.talent))
    .on('pointermove', (e, r) => tip.show(e, [r.talent, `${r.studio} · ${r.title}`, `Share of conversation: ${TT.fmt.pct(r.soc)}`,
      `Relevant posts: ${TT.fmt.int(r.posts)}`, `MoM: ${TT.fmt.signed(r.mom)}`]))
    .on('pointerleave', tip.hide);
  g.append('rect').attr('width', W).attr('height', rowH).style('fill', 'transparent');
  g.append('text').attr('class', 'tt-name').attr('x', 0).attr('y', rowH / 2).attr('dy', '0.35em').text((r) => r.talent);
  g.append('rect').attr('class', 'tt-track').attr('x', labelW).attr('y', rowH / 2 - 5).attr('height', 10).attr('rx', 5).attr('width', trackW);
  g.append('rect').attr('x', labelW).attr('y', rowH / 2 - 5).attr('height', 10).attr('rx', 5)
    .attr('width', (r) => Math.max(10, x(r.soc))).style('fill', fill);
  g.append('text').attr('class', 'tt-val').attr('x', labelW + trackW + 8).attr('y', rowH / 2).attr('dy', '0.35em').text((r) => TT.fmt.pct(r.soc));
  if (studioW) g.append('text').attr('x', W).attr('y', rowH / 2).attr('dy', '0.35em').attr('text-anchor', 'end').text((r) => r.studio);
});

// ---- Talent pull vs title association: bubble scatter ----
dash.draw('scatter', (el) => {
  const d = dash.data('by_talent');
  if (!TT.ready(el, d)) return;
  const p = dash.params();
  const rows = d.data.filter((r) => r.pull_rate != null && r.title_pct != null);
  const W = Math.max(280, el.clientWidth || 600), H = Math.round(Math.min(420, Math.max(300, W * 0.72)));
  const m = { t: 16, r: 16, b: 40, l: 44 };
  el.replaceChildren();
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`)
    .attr('role', 'img').attr('aria-label', 'Scatter of talent-pull rate against title association, one bubble per talent');
  const xe = d3.extent(rows, (r) => r.pull_rate), ye = d3.extent(rows, (r) => r.title_pct);
  const x = d3.scaleLinear([Math.floor(xe[0] - 1), Math.ceil(xe[1] + 1)], [m.l, W - m.r]).nice();
  const y = d3.scaleLinear([Math.max(0, ye[0] - 8), Math.min(100, ye[1] + 8)], [H - m.b, m.t]).nice();
  const r = d3.scaleSqrt([0, d3.max(rows, (q) => q.posts) || 1], [0, Math.min(22, W / 26)]);
  const xm = d3.median(rows, (q) => q.pull_rate), ym = d3.median(rows, (q) => q.title_pct);
  // sweet-spot quadrant tint
  svg.append('rect').attr('x', x(xm)).attr('y', m.t).attr('width', W - m.r - x(xm)).attr('height', y(ym) - m.t).attr('rx', 10)
    .style('fill', PINK).style('fill-opacity', 0.06);
  svg.append('g').attr('class', 'tt-grid').attr('transform', `translate(0,${H - m.b})`)
    .call(d3.axisBottom(x).ticks(Math.max(3, Math.floor(W / 90))).tickFormat((v) => v + '%').tickSize(-(H - m.b - m.t)))
    .call((g) => g.select('.domain').remove());
  svg.append('g').attr('class', 'tt-grid').attr('transform', `translate(${m.l},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat((v) => v + '%').tickSize(-(W - m.l - m.r)))
    .call((g) => g.select('.domain').remove());
  svg.append('line').attr('x1', x(xm)).attr('x2', x(xm)).attr('y1', m.t).attr('y2', H - m.b).style('stroke', 'var(--cds-chart-reference)').style('stroke-dasharray', '3 3');
  svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(ym)).attr('y2', y(ym)).style('stroke', 'var(--cds-chart-reference)').style('stroke-dasharray', '3 3');
  svg.append('text').attr('class', 'tt-quad').attr('x', W - m.r - 8).attr('y', m.t + 16).attr('text-anchor', 'end').text('Pulls viewers to the title');
  svg.append('text').attr('class', 'tt-quad').attr('x', W - m.r - 8).attr('y', H - m.b - 10).attr('text-anchor', 'end').text('Fame without title transfer');
  svg.append('text').attr('x', (m.l + W - m.r) / 2).attr('y', H - 6).attr('text-anchor', 'middle').text('Talent-pull rate');
  svg.append('text').attr('transform', `translate(11,${(m.t + H - m.b) / 2}) rotate(-90)`).attr('text-anchor', 'middle').text('Title association');
  const tip = TT.tip(el);
  const g = svg.selectAll('g.dot').data(rows.slice().sort((a, b) => b.posts - a.posts)).join('g').attr('class', 'dot tt-click')
    .attr('transform', (q) => `translate(${x(q.pull_rate)},${y(q.title_pct)})`)
    .style('opacity', (q) => (p.talent && q.talent !== p.talent ? 0.25 : 1))
    .on('click', (e, q) => toggleTalent(q.talent))
    .on('pointermove', (e, q) => tip.show(e, [q.talent, `${q.studio} · ${q.title}`, `Talent pull: ${TT.fmt.pct(q.pull_rate)}`,
      `Title association: ${TT.fmt.pct(q.title_pct)}`, `Relevant posts: ${TT.fmt.int(q.posts)}`]))
    .on('pointerleave', tip.hide);
  g.append('circle').attr('r', (q) => Math.max(5, r(q.posts))).style('fill', PINK).style('fill-opacity', 0.35)
    .style('stroke', PINK).style('stroke-width', 1.5);
  g.append('circle').attr('r', 2.5).style('fill', DEEP);
  const labels = rows.map((q) => ({ q, x: x(q.pull_rate) + Math.max(5, r(q.posts)) + 4, lx: x(q.pull_rate) - Math.max(5, r(q.posts)) - 4, y: y(q.title_pct) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) {
    for (let j = 0; j < i; j++) {
      const a = labels[j], b = labels[i];
      if (Math.abs(a.x - b.x) < 70 && b.y - a.y < 12) b.y = a.y + 12;
    }
  }
  svg.append('g').selectAll('text').data(labels).join('text').attr('class', 'tt-val')
    .attr('x', (l) => (l.x > W - m.r - 70 ? l.lx : l.x)).attr('y', (l) => l.y).attr('dy', '0.35em')
    .attr('text-anchor', (l) => (l.x > W - m.r - 70 ? 'end' : 'start'))
    .style('opacity', (l) => (p.talent && l.q.talent !== p.talent ? 0.25 : 1))
    .style('pointer-events', 'none').text((l) => short(l.q.talent));
});

// ---- Talent x market heatmap ----
const HM = {
  soc: { label: 'Share of conversation', f: TT.fmt.pct }, pull_rate: { label: 'Talent-pull rate', f: TT.fmt.pct },
  title_pct: { label: 'Title association', f: TT.fmt.pct }, pos_pct: { label: 'Positive tone', f: TT.fmt.pct },
  fatigue_pct: { label: 'Fatigue / rejection', f: TT.fmt.pct, bad: true }, eng_1k: { label: 'Engagement / 1K views', f: TT.fmt.one },
  mom: { label: 'MoM post change', f: TT.fmt.signed, diverging: true }, posts: { label: 'Relevant posts', f: TT.fmt.int },
};
dash.draw('heatmap', (el) => {
  const d = dash.data('heatmap');
  if (!TT.ready(el, d)) return;
  const p = dash.params();
  const key = HM[p.hm] ? p.hm : 'soc', spec = HM[key];
  const countries = ['US', 'MX', 'UK', 'BR', 'FR'].filter((c) => d.data.some((r) => r.country === c));
  const totals = d3.rollup(d.data, (v) => d3.sum(v, (r) => r.posts), (r) => r.talent);
  const studio = new Map(d.data.map((r) => [r.talent, r.studio]));
  const talents = Array.from(totals.keys()).sort((a, b) => totals.get(b) - totals.get(a));
  const cell = new Map(d.data.map((r) => [r.talent + '|' + r.country, r]));
  const W = Math.max(300, el.clientWidth || 700), rowH = 34, headH = 26, H = headH + talents.length * rowH;
  el.replaceChildren();
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`)
    .attr('role', 'img').attr('aria-label', `Heatmap of ${spec.label} by talent and country`);
  const showStudio = W >= 560;
  const labelW = Math.min(W * 0.36, d3.max(talents, (t) => textW(svg, t, 'tt-name')) + 14 + (showStudio ? 0 : 0));
  const cw = (W - labelW) / countries.length;
  const vals = d.data.filter((r) => !r.low_sample && r[key] != null).map((r) => r[key]);
  const ext = d3.extent(vals);
  const amax = d3.max(vals, (v) => Math.abs(v)) || 1;
  const op = (v) => (spec.diverging ? 0.12 + 0.83 * Math.min(1, Math.abs(v) / amax) : ext[1] > ext[0] ? 0.08 + 0.87 * ((v - ext[0]) / (ext[1] - ext[0])) : 0.5);
  const fill = (v) => ((spec.diverging && v < 0) || spec.bad ? PLUM : PINK);
  svg.selectAll('text.col').data(countries).join('text').attr('class', 'col tt-colhead')
    .attr('x', (c, i) => labelW + cw * i + cw / 2).attr('y', 14).attr('text-anchor', 'middle').text((c) => c);
  const tip = TT.tip(el);
  talents.forEach((t, i) => {
    const y0 = headH + i * rowH;
    const lab = svg.append('g').attr('class', 'tt-click').style('opacity', p.talent && p.talent !== t ? 0.4 : 1).on('click', () => toggleTalent(t));
    lab.append('text').attr('class', 'tt-name').attr('x', 0).attr('y', y0 + rowH / 2 - (showStudio ? 5 : 0)).attr('dy', '0.35em').text(t);
    if (showStudio) lab.append('text').attr('x', 0).attr('y', y0 + rowH / 2 + 8).attr('dy', '0.35em').style('font-size', '10px').text(studio.get(t));
    countries.forEach((c, j) => {
      const r = cell.get(t + '|' + c);
      const g = svg.append('g').attr('class', 'tt-click').attr('transform', `translate(${labelW + cw * j + 2},${y0 + 2})`);
      const v = r ? r[key] : null;
      const low = !r || r.low_sample || v == null;
      g.append('rect').attr('width', cw - 4).attr('height', rowH - 4).attr('rx', 8)
        .style('fill', low ? 'var(--cds-chart-muted)' : fill(v)).style('fill-opacity', low ? 0.18 : op(v))
        .style('stroke', p.talent === t && p.country === c ? 'var(--color-fg)' : 'none').style('stroke-width', 1.5);
      const strong = !low && op(v) > 0.55;
      g.append('text').attr('x', (cw - 4) / 2).attr('y', (rowH - 4) / 2).attr('dy', '0.35em').attr('text-anchor', 'middle')
        .attr('class', 'tt-val').style('fill', strong ? '#fff' : 'var(--color-fg)').style('font-size', cw < 56 ? '10px' : '12px')
        .text(!r ? '' : low ? 'low n' : spec.f(v));
      if (r) {
        g.on('click', () => dash.setParams({ talent: t, country: c }))
          .on('pointermove', (e) => tip.show(e, [`${t} · ${TT.COUNTRY[c]}`, r.studio, r.low_sample ? `Low sample: ${r.posts} posts (minimum ${TT.MIN_SAMPLE})` : `Relevant posts: ${TT.fmt.int(r.posts)}`,
            `Share of conversation: ${TT.fmt.pct(r.soc)}`, `Talent pull: ${TT.fmt.pct(r.pull_rate)}`, `Title association: ${TT.fmt.pct(r.title_pct)}`,
            `Positive tone: ${TT.fmt.pct(r.pos_pct)}`, `MoM: ${TT.fmt.signed(r.mom)}`]))
          .on('pointerleave', tip.hide);
      }
    });
  });
});

// ---- Monthly trend with event markers ----
dash.draw('trend', (el) => {
  const d = dash.data('trend'), ev = dash.data('events');
  if (!TT.ready(el, d)) return;
  const p = dash.params();
  const months = Array.from(new Set(d.data.map((r) => r.period))).sort();
  const series = d3.groups(d.data, (r) => r.talent).map(([talent, rows]) => ({
    talent, pts: months.map((m) => ({ m, v: d3.sum(rows.filter((r) => r.period === m), (r) => r.posts) })),
  }));
  const cur = (s) => (s.pts.find((q) => q.m === p.month) || { v: 0 }).v;
  const ranked = series.slice().sort((a, b) => cur(b) - cur(a));
  const colored = new Map(ranked.slice(0, 5).map((s, i) => [s.talent, TT.P[i % TT.P.length]]));
  const W = Math.max(300, el.clientWidth || 800), H = 320;
  el.replaceChildren();
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`)
    .attr('role', 'img').attr('aria-label', 'Line chart of monthly relevant posts by talent');
  const yMax = d3.max(series, (s) => d3.max(s.pts, (q) => q.v)) || 1;
  const y0 = d3.scaleLinear([0, yMax], [H - 30, 12]).nice();
  const yW = textW(svg, d3.format('~s')(y0.domain()[1])) + 12;
  const endW = Math.min(W * 0.28, d3.max(ranked.slice(0, 5), (s) => textW(svg, short(s.talent), 'tt-val')) + 16);
  const x = d3.scalePoint(months, [yW + 8, W - endW]);
  svg.append('g').attr('class', 'tt-grid').attr('transform', `translate(${yW},0)`)
    .call(d3.axisLeft(y0).ticks(5).tickFormat(d3.format('~s')).tickSize(-(W - endW - yW)))
    .call((g) => g.select('.domain').remove());
  svg.append('g').attr('class', 'tt-grid').attr('transform', `translate(0,${H - 30})`)
    .call(d3.axisBottom(x).tickFormat((m) => d3.utcFormat(W < 480 ? '%b' : '%b %Y')(new Date(m + '-01T00:00:00Z'))).tickSize(0).tickPadding(10))
    .call((g) => g.select('.domain').remove());
  if (months.includes(p.month)) {
    svg.append('rect').attr('x', x(p.month) - 18).attr('width', 36).attr('y', 8).attr('height', H - 38).attr('rx', 10)
      .style('fill', PINK).style('fill-opacity', 0.07);
  }
  // soft area under the leader
  const lead = ranked[0];
  if (lead) {
    const grad = svg.append('defs').append('linearGradient').attr('id', 'trendg').attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
    grad.append('stop').attr('offset', 0).attr('stop-color', PINK).attr('stop-opacity', 0.22);
    grad.append('stop').attr('offset', 1).attr('stop-color', PINK).attr('stop-opacity', 0);
    svg.append('path').attr('d', d3.area().x((q) => x(q.m)).y0(H - 30).y1((q) => y0(q.v))(lead.pts)).style('fill', PINK).style('fill-opacity', 0.07);
  }
  const line = d3.line().x((q) => x(q.m)).y((q) => y0(q.v));
  const order = series.slice().sort((a, b) => (colored.has(a.talent) ? 1 : 0) - (colored.has(b.talent) ? 1 : 0));
  svg.append('g').selectAll('path').data(order).join('path').attr('d', (s) => line(s.pts)).style('fill', 'none')
    .style('stroke', (s) => colored.get(s.talent) || 'var(--cds-chart-muted)').style('stroke-width', (s) => (colored.has(s.talent) ? 2.5 : 1))
    .style('stroke-linejoin', 'round').style('stroke-linecap', 'round')
    .style('opacity', (s) => (colored.has(s.talent) ? 1 : 0.5));
  const evs = ev.status === 'ok' ? ev.data.filter((e) => series.some((s) => s.talent === e.talent) && months.includes(e.period)) : [];
  const valOf = (t, m) => { const s = series.find((q) => q.talent === t); return s ? s.pts.find((q) => q.m === m).v : 0; };
  svg.append('g').selectAll('circle').data(evs).join('circle').attr('cx', (e) => x(e.period)).attr('cy', (e) => y0(valOf(e.talent, e.period)))
    .attr('r', 5).style('fill', 'var(--color-bg)').style('stroke', (e) => colored.get(e.talent) || 'var(--cds-chart-muted)').style('stroke-width', 2);
  const ends = ranked.slice(0, 5).map((s) => ({ s, y: y0(s.pts[s.pts.length - 1].v) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
  svg.append('g').selectAll('text').data(ends).join('text').attr('class', 'tt-val').attr('x', W - endW + 8).attr('y', (e) => e.y).attr('dy', '0.35em')
    .style('fill', (e) => colored.get(e.s.talent)).text((e) => short(e.s.talent));
  const tip = TT.tip(el);
  const guide = svg.append('line').attr('y1', 12).attr('y2', H - 30).style('stroke', 'var(--cds-chart-axis)').style('opacity', 0);
  svg.append('rect').attr('x', yW).attr('y', 0).attr('width', W - endW - yW + 8).attr('height', H - 30).style('fill', 'transparent')
    .on('pointermove', (e) => {
      const [mx] = d3.pointer(e);
      const m = months.reduce((a, b) => (Math.abs(x(b) - mx) < Math.abs(x(a) - mx) ? b : a));
      guide.attr('x1', x(m)).attr('x2', x(m)).style('opacity', 1);
      const top = series.slice().sort((a, b) => valOf(b.talent, m) - valOf(a.talent, m)).slice(0, 6);
      const lines = [TT.monthLabel(m), ...top.map((s) => `${s.talent}: ${TT.fmt.int(valOf(s.talent, m))}`)];
      evs.filter((q) => q.period === m).forEach((q) => lines.push(`Event: ${q.talent} — ${q.event}`));
      tip.show(e, lines);
    })
    .on('pointerleave', () => { tip.hide(); guide.style('opacity', 0); });
});

// ---- 100% stacked bars for intent and tone ----
function stacked(el, cats) {
  const d = dash.data('by_talent');
  if (!TT.ready(el, d)) return;
  const p = dash.params();
  const rows = d.data;
  const W = Math.max(280, el.clientWidth || 600), rowH = 28;
  el.replaceChildren();
  const leg = document.createElement('div'); leg.className = 'tt-legend';
  cats.forEach((c) => { const s = document.createElement('span'); const i = document.createElement('i'); i.className = 'tt-sw'; i.style.background = c.color; s.append(i, c.label); leg.append(s); });
  el.append(leg);
  const H = rows.length * rowH + 4;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`)
    .attr('role', 'img').attr('aria-label', 'Stacked bars by talent: ' + cats.map((c) => c.label).join(', '));
  const labelW = Math.min(W * 0.4, d3.max(rows, (r) => textW(svg, r.talent, 'tt-name')) + 12);
  const x = d3.scaleLinear([0, 100], [labelW, W - 2]);
  const tip = TT.tip(el);
  rows.forEach((r, i) => {
    const g = svg.append('g').attr('class', 'tt-click').attr('transform', `translate(0,${i * rowH + 2})`)
      .style('opacity', p.talent && r.talent !== p.talent ? 0.3 : 1)
      .on('click', () => toggleTalent(r.talent))
      .on('pointermove', (e) => tip.show(e, [r.talent, ...cats.map((c) => `${c.label}: ${TT.fmt.pct(r[c.key])}`)]))
      .on('pointerleave', tip.hide);
    g.append('text').attr('class', 'tt-name').attr('x', 0).attr('y', rowH / 2).attr('dy', '0.35em').text(r.talent);
    const clip = `clip-${el.dataset.draw}-${i}`;
    g.append('clipPath').attr('id', clip).append('rect').attr('x', labelW).attr('y', 6).attr('height', rowH - 12).attr('width', W - 2 - labelW).attr('rx', (rowH - 12) / 2);
    const bars = g.append('g').attr('clip-path', `url(#${clip})`);
    let acc = 0;
    cats.forEach((c) => {
      const v = r[c.key] || 0;
      bars.append('rect').attr('x', x(acc)).attr('y', 6).attr('height', rowH - 12).attr('width', Math.max(0, x(acc + v) - x(acc) - 1.5)).style('fill', c.color);
      if (x(acc + v) - x(acc) > 34) {
        g.append('text').attr('class', 'tt-val').attr('x', x(acc) + 6).attr('y', rowH / 2).attr('dy', '0.35em').style('fill', c.light ? 'var(--color-fg)' : '#fff').style('font-size', '10px').text(Math.round(v) + '%');
      }
      acc += v;
    });
  });
}
dash.draw('intent_chart', (el) => stacked(el, [
  { key: 'wants_pct', label: 'Wants to watch', color: TT.P[0] },
  { key: 'rec_pct', label: 'Recommends', color: TT.P[2] },
  { key: 'fan_pct', label: 'Fan / advocacy', color: TT.P[1], light: true },
  { key: 'fatigue_pct', label: 'Fatigue / rejection', color: TT.P[3] },
  { key: 'other_pct', label: 'Other discussion', color: 'var(--cds-chart-muted)', light: true },
]));
dash.draw('tone_chart', (el) => stacked(el, [
  { key: 'pos_pct', label: 'Positive', color: TT.P[0] },
  { key: 'neu_pct', label: 'Neutral', color: 'var(--cds-chart-muted)', light: true },
  { key: 'neg_pct', label: 'Negative', color: TT.P[3] },
]));
