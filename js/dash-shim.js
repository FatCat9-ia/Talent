// Minimal stand-in for the dashboard runtime, so the page runs as a plain static site.
// It implements the small `dash` API the page scripts use: data sources, calcs, drawings,
// filters (params) and redraws. Data is read from the JSON files in /data.
(function () {
  const SOURCES = {
    matrix: 'data/sample_talent_matrix.json',
    context: 'data/sample_talent_context.json',
    posts: 'data/sample_posts.json',
    events: 'data/sample_events.json',
    talents: 'data/talent_roster.json',
  };
  const DEFAULTS = { month: '2026-10', country: '', talent: '', platform: '', studio: '', hm: 'soc' };

  const loaded = {};   // id -> {status, data, columns}
  const calcs = {};    // id -> {inputs, fn}
  const cache = {};    // id -> {version, result}
  const draws = [];    // [name, fn]
  const listeners = [];
  let params = readHash();
  let version = 0;
  let scheduled = false;

  function readHash() {
    const p = Object.assign({}, DEFAULTS);
    try {
      new URLSearchParams(location.hash.replace(/^#/, '')).forEach((v, k) => { if (k in DEFAULTS) p[k] = v; });
    } catch (e) { /* ignore */ }
    return p;
  }
  function writeHash() {
    const q = new URLSearchParams();
    Object.keys(params).forEach((k) => { if (params[k] && params[k] !== DEFAULTS[k]) q.set(k, params[k]); });
    const h = q.toString();
    history.replaceState(null, '', h ? '#' + h : location.pathname + location.search);
  }

  function load(id) {
    if (loaded[id]) return;
    loaded[id] = { status: 'loading', data: [] };
    fetch(SOURCES[id])
      .then((r) => { if (!r.ok) throw new Error(r.status + ' ' + r.statusText); return r.json(); })
      .then((j) => {
        const rows = Array.isArray(j) ? j : j.rows || j.data || [];
        loaded[id] = { status: 'ok', data: rows, columns: rows.length ? Object.keys(rows[0]) : [] };
        changed();
      })
      .catch((e) => { console.error('Could not load', id, e); loaded[id] = { status: 'error', data: [], message: String(e) }; changed(); });
  }

  function data(id) {
    if (calcs[id]) {
      const c = cache[id];
      if (c && c.version === version) return c.result;
      const ins = calcs[id].inputs.map(data);
      let result;
      const bad = ins.find((d) => d.status !== 'ok');
      if (bad) result = { status: bad.status, data: null };
      else {
        try {
          const out = calcs[id].fn(...ins.map((d) => d.data));
          result = { status: 'ok', data: out, columns: Array.isArray(out) && out.length ? Object.keys(out[0]) : [] };
        } catch (e) { console.error('calc', id, e); result = { status: 'error', data: null, message: String(e) }; }
      }
      cache[id] = { version, result };
      return result;
    }
    if (!SOURCES[id]) return { status: 'missing', data: [] };
    load(id);
    return loaded[id];
  }

  function changed() { version++; schedule(); }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; render(); });
  }
  function render() {
    listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    draws.forEach(([name, fn]) => {
      document.querySelectorAll(`[data-draw="${name}"]`).forEach((el) => {
        if (el.closest('[hidden]')) return;
        try { fn(el); } catch (e) { console.error('draw', name, e); }
      });
    });
  }

  window.dash = {
    colors: ['#D6247E', '#F4A6CB', '#9C1A63', '#5E0A3C', '#E86AA6'],
    data,
    calc(id, spec) { calcs[id] = spec; },
    loader() {},
    draw(name, fn) {
      if (typeof fn === 'function') draws.push([name, fn]);
      else if (!fn) schedule();
    },
    onData(fn) { listeners.push(fn); },
    params() { return Object.assign({}, params); },
    setParams(next) {
      Object.keys(next).forEach((k) => { params[k] = next[k] == null ? DEFAULTS[k] ?? '' : next[k]; });
      writeHash(); changed();
    },
    resetParams() { params = Object.assign({}, DEFAULTS); writeHash(); changed(); },
    setLink() {},
    refresh() {},
  };

  document.addEventListener('DOMContentLoaded', () => {
    render();
    let w = 0;
    new ResizeObserver(() => {
      const nw = document.body.clientWidth;
      if (Math.abs(nw - w) > 4) { w = nw; schedule(); }
    }).observe(document.body);
  });
})();
