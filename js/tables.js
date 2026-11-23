// Table bodies. Each row carries data-key so its cells match the calc rows.
function td(text, cls) { const c = document.createElement('td'); c.textContent = text; if (cls) c.className = cls; return c; }
function fill(el, d, cols, rows, keyOf, selOf) {
  if (d.status !== 'ok' || !rows.length) {
    const tr = document.createElement('tr');
    const c = td(d.status === 'error' ? 'This table failed to load.' : d.status === 'ok' ? 'No rows match these filters.' : '—', 'tt-note');
    c.colSpan = cols;
    tr.append(c);
    el.replaceChildren(tr);
    return false;
  }
  return true;
}

dash.draw('platform_rows', (el) => {
  const d = dash.data('by_platform');
  if (!fill(el, d, 9, d.data || [])) return;
  const p = dash.params();
  const max = d3.max(d.data, (r) => r.share) || 1;
  el.replaceChildren(...d.data.map((r) => {
    const tr = document.createElement('tr');
    tr.dataset.key = TT.enc(r.platform);
    if (p.platform === r.platform) tr.className = 'tt-row-sel';
    const share = document.createElement('td');
    const wrap = document.createElement('div'); wrap.className = 'tt-bar';
    const bar = document.createElement('i'); bar.style.width = Math.max(2, (r.share / max) * 100) + 'px'; bar.style.background = TT.P[0];
    const txt = document.createElement('span'); txt.textContent = TT.fmt.pct(r.share);
    wrap.append(bar, txt); share.append(wrap);
    tr.append(td(r.platform, 'tt-nowrap'), td(TT.fmt.int(r.posts), 'tt-num'), share, td(TT.fmt.one(r.eng_1k), 'tt-num'),
      td(TT.fmt.pct(r.pull_rate), 'tt-num'), td(TT.fmt.pct(r.title_pct), 'tt-num'), td(TT.fmt.pct(r.pos_pct), 'tt-num'),
      td(TT.fmt.pct(r.neg_pct), 'tt-num'), td(TT.fmt.pct(r.view_cov), 'tt-num'));
    return tr;
  }));
});

dash.draw('market_rows', (el) => {
  const d = dash.data('markets');
  if (!fill(el, d, 14, d.data || [])) return;
  el.replaceChildren(...d.data.map((r) => {
    const tr = document.createElement('tr');
    tr.dataset.key = TT.enc(r.talent) + ',' + TT.enc(r.country);
    const mom = td(TT.fmt.signed(r.mom), 'tt-num ' + (r.mom > 0 ? 'tt-good' : r.mom < 0 ? 'tt-bad' : ''));
    const sample = document.createElement('td');
    const b = document.createElement('span'); b.className = 'tt-badge' + (r.sample === 'Low sample' ? ' tt-warn' : ''); b.textContent = r.sample; sample.append(b);
    const low = r.sample === 'Low sample';
    tr.append(td(r.talent, 'tt-nowrap'), td(r.studio, 'tt-nowrap tt-muted'), td(r.country), td(TT.fmt.int(r.posts), 'tt-num'), td(TT.fmt.pct(r.soc), 'tt-num'), mom,
      td(low ? '—' : TT.fmt.pct(r.pull_rate), 'tt-num'), td(low ? '—' : TT.fmt.pct(r.title_pct), 'tt-num'),
      td(low ? '—' : TT.fmt.pct(r.pos_pct), 'tt-num'), td(low ? '—' : TT.fmt.pct(r.fatigue_pct), 'tt-num'),
      td(TT.fmt.text(r.top_driver)), td(r.event_response == null ? '—' : '+' + r.event_response + '%', 'tt-num'), sample,
      td(TT.fmt.text(r.readout), 'tt-wide'));
    if (r.event) tr.cells[11].title = r.event;
    return tr;
  }));
});

dash.draw('post_rows', (el) => {
  const d = dash.data('posts_view');
  if (!fill(el, d, 13, d.data || [])) return;
  const date = d3.utcFormat('%b %-d, %Y');
  el.replaceChildren(...d.data.map((r) => {
    const tr = document.createElement('tr');
    tr.dataset.key = TT.enc(r.record_id);
    tr.append(td(date(new Date(r.published_at + 'T00:00:00Z')), 'tt-nowrap'), td(r.platform, 'tt-nowrap'), td(r.country), td(r.talent, 'tt-nowrap'),
      td(r.excerpt, 'tt-wide'), td(r.intent, 'tt-nowrap'), td(r.tone), td(r.talent_pull),
      td(r.views == null ? '—' : TT.fmt.int(r.views), 'tt-num'), td(TT.fmt.int(r.engagement), 'tt-num'),
      td(r.country_confidence == null ? '—' : r.country_confidence.toFixed(2), 'tt-num'), td(r.human_validated),
      td(r.public_url, 'tt-nowrap'));
    return tr;
  }));
});
