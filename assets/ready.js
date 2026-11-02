/* «آماده باشیم» (fa/ready/, fa/ready/<slug>/, en/ready/): the readiness ring, ticks, myths, drills, the kit calculator, the
   family card, the 10-question drill, the offline copy and the quick exit. build/ready.py draws the pages and hands this file
   its data in <script id="rd-data">. Nothing here sends anything anywhere: the only network calls are the offline copy
   (the reader's own press, same site only) and the share sheet the reader opens.
   Storage: one object under "r1:s", in sessionStorage unless the reader turns on the keep switch ("r1:keep" in
   localStorage), which moves it to localStorage. The quick exit and "clear everything" remove every "r1:" key in both. */
(function () {
  'use strict';
  var dataEl = document.getElementById('rd-data');
  if (!dataEl) { return; }
  var D = JSON.parse(dataEl.textContent), W = D.w, K = D.key, FA = D.lang === 'fa';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var num = function (n) { return FA ? String(n).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.charAt(+d); }) : String(n); };
  var fmt = function (s, o) { return String(s).replace(/\{(\w)\}/g, function (m, k) { return k in o ? (typeof o[k] === 'number' ? num(o[k]) : String(o[k])) : m; }); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var pctSign = FA ? '٪' : '%', OF = FA ? ' از ' : ' of ';

  // ------------------------------------------------------------------ storage
  function probe(kind) { try { var s = window[kind], k = K + 'probe'; s.setItem(k, '1'); s.removeItem(k); return s; } catch (e) { return null; } }
  var LS = probe('localStorage'), SS = probe('sessionStorage');
  var keep = false;
  try { keep = !!LS && LS.getItem(K + 'keep') === '1'; } catch (e) { keep = false; }
  var store = keep ? LS : SS;
  function fresh() { return { t: {}, d: {}, m: {}, p: {}, k: { t: {} }, B: {} }; }
  function read() {
    var o = null;
    try { o = JSON.parse((store && store.getItem(K + 's')) || 'null'); } catch (e) { o = null; }
    var f = fresh();
    if (!o || typeof o !== 'object') { return f; }
    Object.keys(f).forEach(function (k) { if (!o[k] || typeof o[k] !== 'object') { o[k] = f[k]; } });
    if (!o.k.t) { o.k.t = {}; }
    return o;
  }
  var S = read();
  function save() { try { if (store) { store.setItem(K + 's', JSON.stringify(S)); } } catch (e) { /* full or refused: the page still works for this visit */ } }
  function wipe() {
    [LS, SS].forEach(function (s) {
      if (!s) { return; }
      try { Object.keys(s).forEach(function (k) { if (k.indexOf(K) === 0) { s.removeItem(k); } }); } catch (e) { /* nothing to clear */ }
    });
  }
  function setKeep(on) {
    var data = JSON.stringify(S);
    try {
      if (on && LS) { LS.setItem(K + 'keep', '1'); LS.setItem(K + 's', data); if (SS) { SS.removeItem(K + 's'); } store = LS; }
      else { if (LS) { LS.removeItem(K + 'keep'); LS.removeItem(K + 's'); } if (SS) { SS.setItem(K + 's', data); } store = SS; }
      keep = !!on;
    } catch (e) { keep = false; }
  }

  // ------------------------------------------------------------------ the quick exit (one tap; Esc twice on a computer)
  function leave() {
    var b = $('#rd-exit');
    wipe();
    location.replace((b && b.getAttribute('data-to')) || 'about:blank');
  }
  var exitBtn = $('#rd-exit');
  if (exitBtn) { exitBtn.addEventListener('click', leave); }
  var lastEsc = 0;
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') { return; }
    if (openCard()) { closeCard(); lastEsc = 0; return; }
    var now = Date.now();
    if (now - lastEsc < 900) { leave(); return; }
    lastEsc = now;
  });

  // ------------------------------------------------------------------ the readiness ring, levels, badges
  var ALL = [];
  D.guides.forEach(function (g) { ALL = ALL.concat(g.i); });
  function ticked(id) { return !!S.t[id]; }
  function progress() {
    var n = ALL.filter(ticked).length, t = ALL.length;
    return { n: n, t: t, p: t ? Math.round(100 * n / t) : 0 };
  }
  function levelOf(p) { var i = 0; D.levels.forEach(function (l, j) { if (p >= l.at) { i = j; } }); return i; }
  function drillRight(slug, i) { var v = (S.d[slug] || {})[i]; return typeof v === 'string' && v.charAt(0) === 'y'; }
  function badge(g) {
    if (!g.i.every(ticked)) { return false; }
    for (var i = 0; i < g.n; i++) { if (!drillRight(g.s, i)) { return false; } }
    return true;
  }
  function toast(t) {
    var el = $('#rd-toast');
    if (!el) { return; }
    el.textContent = t;
    el.classList.add('on');
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { el.classList.remove('on'); }, 4200);
  }
  function celebrate(el) {
    if (!el) { return; }
    el.classList.remove('rd-up');
    void el.offsetWidth;
    el.classList.add('rd-up');
    setTimeout(function () { el.classList.remove('rd-up'); }, 1500);
  }
  function tickRow(id, text) {
    return '<li><label class="rd-tick"><input type="checkbox" data-id="' + esc(id) + '"' + (ticked(id) ? ' checked' : '') + '>' +
      '<span class="rd-box" aria-hidden="true"><svg class="rd-i" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>' +
      '<span>' + esc(text) + '</span></label></li>';
  }
  function paint(first) {
    var P = progress(), lv = levelOf(P.p), L = D.levels;
    $$('.rd-ring-fg').forEach(function (c) { c.setAttribute('stroke-dasharray', P.p + ' 100'); });
    $$('#rd-pct').forEach(function (el) { el.textContent = num(P.p) + pctSign; });
    var lvEl = $('#rd-lv');
    if (lvEl) { lvEl.textContent = L[lv].n; }
    var nx = $('#rd-lvnext');
    if (nx) {
      if (lv + 1 < L.length) {
        var need = Math.max(1, Math.ceil(L[lv + 1].at / 100 * P.t) - P.n);
        nx.textContent = fmt(W.next_level, { n: L[lv + 1].n, k: need });
      } else { nx.textContent = W.top_level; }
    }
    var n3 = $('#rd-next3');
    if (n3) {
      var order = D.priority.concat(D.guides.map(function (g) { return g.s; }).filter(function (s) { return D.priority.indexOf(s) < 0; }));
      var picks = [];
      order.forEach(function (s) {
        var g = D.guides.filter(function (x) { return x.s === s; })[0];
        if (!g) { return; }
        g.i.forEach(function (id, j) { if (picks.length < 3 && !ticked(id)) { picks.push([id, g.c[j]]); } });
      });
      n3.innerHTML = picks.length ? picks.map(function (x) { return tickRow(x[0], x[1]); }).join('') : '<li class="rd-allgood">' + esc(W.next3_none) + '</li>';
    }
    D.guides.forEach(function (g) {
      var on = badge(g);
      $$('[data-badge="' + g.s + '"]').forEach(function (b) { b.classList.toggle('rd-lit', on); });
      var card = $('.rd-card[data-slug="' + g.s + '"]');
      if (card) {
        var n = g.i.filter(ticked).length;
        var bar = $('[data-bar]', card), cnt = $('[data-count]', card);
        if (bar) { bar.style.width = (g.i.length ? Math.round(100 * n / g.i.length) : 0) + '%'; }
        if (cnt) { cnt.textContent = n ? num(n) + (FA ? ' از ' : ' of ') + num(g.i.length) : ''; }
        card.classList.toggle('rd-lit', on);
      }
    });
    // the board on the hub: the five levels, the three counts, and each track's badges
    $$('#rd-ladder li').forEach(function (li) { var i = +li.getAttribute('data-lv'); li.classList.toggle('rd-on', i <= lv); li.classList.toggle('rd-cur', i === lv); });
    var lit = D.guides.filter(badge), sd = $('#rd-st-done'), sb = $('#rd-st-badges'), sx = $('#rd-st-best');
    if (sd) { sd.textContent = num(P.n) + OF + num(P.t); }
    if (sb) { sb.textContent = num(lit.length) + OF + num(D.guides.length); }
    if (sx) { sx.textContent = typeof S.b === 'number' ? num(S.b) + OF + num(Math.min(10, (D.drills || []).length)) : W.st_none; }
    $$('[data-trk]').forEach(function (el) {
      var k = el.getAttribute('data-trk'), n = lit.filter(function (g) { return g.k === k; }).length;
      el.textContent = fmt(W.trk_n, { n: n, t: +el.getAttribute('data-of') });
      el.classList.toggle('rd-has', n > 0);
    });
    $$('input[type="checkbox"][data-id]').forEach(function (c) { c.checked = ticked(c.getAttribute('data-id')); });
    if (typeof S.L !== 'number') { S.L = lv; save(); }
    else if (lv > S.L) {
      S.L = lv; save();
      if (!first) { celebrate($('#rd-ring') || $('#rd-mini')); toast(fmt(W.level_up, { n: L[lv].n })); }
    } else if (lv < S.L) { S.L = lv; save(); }
    if (D.slug) {
      var me = D.guides.filter(function (x) { return x.s === D.slug; })[0];
      if (me && badge(me) && !S.B[me.s]) { S.B[me.s] = 1; save(); if (!first) { toast(W.badge_on); celebrate($('#rd-mini')); } }
      if (me && !badge(me) && S.B[me.s]) { delete S.B[me.s]; save(); }
    }
  }

  document.addEventListener('change', function (ev) {
    var c = ev.target;
    if (c.matches && c.matches('input[type="checkbox"][data-id]')) {
      var id = c.getAttribute('data-id');
      if (c.checked) { S.t[id] = 1; } else { delete S.t[id]; }
      save(); paint(false);
    } else if (c.matches && c.matches('input[type="checkbox"][data-kit]')) {
      if (c.checked) { S.k.t[c.getAttribute('data-kit')] = 1; } else { delete S.k.t[c.getAttribute('data-kit')]; }
      save();
    } else if (c.id === 'rd-keep') {
      setKeep(c.checked);
    } else if (c.name === 'k-days') {
      S.k.d = +c.value; save(); kit();
    }
  });

  // ------------------------------------------------------------------ the emergency cards (CSS :target opens them; this adds focus and the scroll lock)
  function openCard() { return /^#now-[\w-]+$/.test(location.hash) ? document.getElementById(location.hash.slice(1)) : null; }
  function closeCard() { if (openCard()) { location.hash = 'rd-now'; } }
  function onHash() {
    var c = openCard();
    document.documentElement.classList.toggle('rd-lock', !!c);
    if (c) { c.focus({ preventScroll: true }); }
  }
  window.addEventListener('hashchange', onHash);
  onHash();

  // ------------------------------------------------------------------ myths: «درسته» / «غلطه» (every myth in the data is a wrong belief)
  function paintMyth(li, ans) {
    var right = ans === '0';
    li.classList.add('rd-done');
    li.classList.toggle('rd-ok', right);
    li.classList.toggle('rd-no', !right);
    $$('[data-tf]', li).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-tf') === ans ? 'true' : 'false'); });
    var v = $('.rd-verdict', li);
    if (v) { v.textContent = right ? W.myth_ok : W.myth_no; }
  }
  $$('.rd-myth').forEach(function (li) {
    var i = li.getAttribute('data-myth'), had = (S.m[D.slug] || {})[i];
    if (had === '0' || had === '1') { paintMyth(li, had); }
    $$('[data-tf]', li).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-tf');
        S.m[D.slug] = S.m[D.slug] || {};
        S.m[D.slug][i] = a; save(); paintMyth(li, a);
      });
    });
  });

  // ------------------------------------------------------------------ drills on a guide page
  function markDrill(box, j, okIdx) {
    var right = j === okIdx;
    box.classList.add('rd-done');
    $$('.rd-opt', box).forEach(function (b) {
      var o = +b.getAttribute('data-o');
      b.classList.toggle('rd-pick', o === j);
      b.classList.toggle('rd-right', o === okIdx);
      b.classList.toggle('rd-wrongpick', o === j && !right);
      b.setAttribute('aria-pressed', o === j ? 'true' : 'false');
    });
    box.classList.toggle('rd-ok', right);
    box.classList.toggle('rd-no', !right);
    var v = $('.rd-verdict', box);
    if (v) { v.textContent = right ? W.right : W.wrong; }
  }
  $$('.rd-drill').forEach(function (box) {
    var i = box.getAttribute('data-drill'), okB = $('.rd-opt[data-ok]', box), okIdx = okB ? +okB.getAttribute('data-o') : -1;
    var had = (S.d[D.slug] || {})[i];
    if (typeof had === 'string') { markDrill(box, +had.slice(1), okIdx); }
    $$('.rd-opt', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var j = +b.getAttribute('data-o');
        S.d[D.slug] = S.d[D.slug] || {};
        S.d[D.slug][i] = (j === okIdx ? 'y' : 'n') + j;
        save(); markDrill(box, j, okIdx); paint(false);
      });
    });
  });

  // ------------------------------------------------------------------ the 10-question drill (hub)
  var dbox = $('#rd-drill-box'), round = [], at = 0, score = 0, missed = [], answered = false;
  function bestLine() { var b = $('#rd-best'); if (b) { b.textContent = typeof S.b === 'number' ? fmt(W.best, { b: S.b, n: Math.min(10, (D.drills || []).length) }) : ''; } }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function startRound(list) { round = list; at = 0; score = 0; missed = []; showQ(); }
  function letters() { return W.letters.split('|'); }
  function showQ() {
    var q = round[at], L = letters();
    answered = false;
    dbox.innerHTML = '<p class="rd-q-of">' + esc(fmt(W.q_of, { i: at + 1, n: round.length })) + '</p>' +
      '<p class="rd-drill-q">' + esc(q.q) + '</p><ul class="rd-opts">' +
      q.o.map(function (o, j) { return '<li><button type="button" class="rd-opt" data-o="' + j + '"><span class="rd-opt-l">' + esc(L[j]) + '</span><span>' + esc(o) + '</span></button></li>'; }).join('') +
      '</ul><p class="rd-why"><b class="rd-verdict"></b> <span>' + esc(q.y) + '</span></p><p class="rd-row rd-drill-next"></p>';
    dbox.classList.remove('rd-done', 'rd-ok', 'rd-no');
    $$('.rd-opt', dbox).forEach(function (b) {
      b.addEventListener('click', function () {
        if (answered) { return; }
        answered = true;
        var j = +b.getAttribute('data-o'), right = j === q.ok;
        if (right) { score++; } else { missed.push(q); }
        S.d[q.s] = S.d[q.s] || {};
        S.d[q.s][q.i] = (right ? 'y' : 'n') + j;
        save();
        markDrill(dbox, j, q.ok);
        var nx = $('.rd-drill-next', dbox), last = at + 1 >= round.length;
        nx.innerHTML = '<button class="btn btn-key" type="button">' + esc(last ? W.see : W.next) + '</button>';
        var btn = $('button', nx);
        btn.addEventListener('click', function () { if (last) { endRound(); } else { at++; showQ(); var f = $('.rd-opt', dbox); if (f) { f.focus(); } } });
        btn.focus();
        paint(false);
      });
    });
  }
  function endRound() {
    var full = round.length === Math.min(10, D.drills.length);
    if (full && (typeof S.b !== 'number' || score > S.b)) { S.b = score; save(); }
    dbox.classList.remove('rd-done', 'rd-ok', 'rd-no');
    dbox.innerHTML = '<p class="rd-score">' + esc(fmt(W.result, { s: score, n: round.length })) + '</p><p class="rd-row">' +
      '<button class="btn btn-key" type="button" data-go="again">' + esc(W.again) + '</button>' +
      (missed.length ? '<button class="btn btn-line" type="button" data-go="redo">' + esc(W.redo) + '</button>' : '') + '</p>';
    var keepMissed = missed.slice();
    $$('[data-go]', dbox).forEach(function (b) {
      b.addEventListener('click', function () { startRound(b.getAttribute('data-go') === 'redo' ? keepMissed : shuffle(D.drills).slice(0, 10)); var f = $('.rd-opt', dbox); if (f) { f.focus(); } });
    });
    bestLine(); paint(false);
    if (full && score === round.length) { celebrate(dbox); }
  }
  if (dbox && D.drills) {
    var counter = {};
    D.drills.forEach(function (q) { counter[q.s] = (counter[q.s] || 0); q.i = counter[q.s]++; });
    var go = $('#rd-drill-go');
    if (go) { go.addEventListener('click', function () { startRound(shuffle(D.drills).slice(0, 10)); var f = $('.rd-opt', dbox); if (f) { f.focus(); } }); }
    bestLine();
  }

  // ------------------------------------------------------------------ the kit calculator
  var kitList = $('#rd-kit-l');
  var KV = { adults: 2, kids: 0, babies: 0, pets: 0 };
  function kit() {
    if (!kitList) { return; }
    var v = S.k.v || {}, a = v.adults != null ? v.adults : KV.adults, c = v.kids || 0, b = v.babies || 0, p = v.pets || 0, d = S.k.d || 7;
    ['adults', 'kids', 'babies', 'pets'].forEach(function (k) { var o = $('#k-' + k); if (o) { var x = { adults: a, kids: c, babies: b, pets: p }[k]; o.textContent = num(x); o.setAttribute('data-v', x); } });
    $$('input[name="k-days"]').forEach(function (r) { r.checked = +r.value === d; });
    var people = a + c + b, rows = [];
    rows.push(['water', fmt(W.k_water, { n: 4 * people * d }), W.k_water_d]);
    rows.push(['food', fmt(W.k_food, { d: d, n: (a + c) * d * 3 }), W.k_food_d]);
    rows.push(['power', fmt(W.k_power, { n: Math.max(1, a) }), W.k_power_d]);
    rows.push(['meds', fmt(W.k_meds, { n: Math.ceil(d / 7) + 1 }), W.k_meds_d]);
    if (b) { rows.push(['baby', fmt(W.k_baby, { d: d }), fmt(W.k_baby_d, { n: b })]); }
    if (p) { rows.push(['pets', fmt(W.k_pets, { d: d }), fmt(W.k_pets_d, { n: p })]); }
    W.k_fixed.split('|').forEach(function (t, i) { rows.push(['x' + i, t, '']); });
    kitList.innerHTML = rows.map(function (r) {
      return '<li><label class="rd-tick"><input type="checkbox" data-kit="' + r[0] + '"' + (S.k.t[r[0]] ? ' checked' : '') + '>' +
        '<span class="rd-box" aria-hidden="true"><svg class="rd-i" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>' +
        '<span><b>' + esc(r[1]) + '</b>' + (r[2] ? '<small>' + esc(r[2]) + '</small>' : '') + '</span></label></li>';
    }).join('');
  }
  $$('[data-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var k = btn.getAttribute('data-step'), dlt = +btn.getAttribute('data-d');
      S.k.v = S.k.v || {};
      var cur = S.k.v[k] != null ? S.k.v[k] : KV[k];
      S.k.v[k] = Math.max(k === 'adults' ? 1 : 0, Math.min(20, cur + dlt));
      save(); kit();
    });
  });
  kit();

  // ------------------------------------------------------------------ the family plan card
  var planFields = $$('[data-plan]');
  planFields.forEach(function (f) {
    var k = f.getAttribute('data-plan');
    if (S.p[k]) { f.value = S.p[k]; }
    f.addEventListener('input', function () { if (f.value) { S.p[k] = f.value; } else { delete S.p[k]; } save(); });
  });
  function planCard() {
    var card = $('#rd-plan-card');
    if (!card) { return; }
    card.innerHTML = '<p class="rd-pc-h">' + esc(W.plan_card) + '</p><dl>' + planFields.map(function (f) {
      var lab = f.closest('label').querySelector('span').textContent;
      return '<dt>' + esc(lab) + '</dt><dd>' + (f.value ? esc(f.value) : '&nbsp;') + '</dd>';
    }).join('') + '</dl>';
  }
  $$('[data-print]').forEach(function (b) {
    b.addEventListener('click', function () {
      var what = b.getAttribute('data-print'), H = document.documentElement;
      if (what === 'plan') { planCard(); }
      // the printed sheet is a copy straight under <body>, and print shows nothing else: hiding the page in place (visibility)
      // kept its height, and the one-page card printed as eleven pages, ten of them blank (measured 2 November 2026)
      var src = $(what === 'plan' ? '#rd-plan-card' : '#rd-kit-out'), sheet = document.createElement('div');
      sheet.className = 'rd-sheet ' + (what === 'plan' ? 'rd-plan-card' : 'rd-kit-out');
      sheet.setAttribute('dir', document.documentElement.getAttribute('dir') || 'rtl');
      if (src) {
        [].slice.call(src.childNodes).forEach(function (n) { sheet.appendChild(n.cloneNode(true)); });
        var from = $$('input', src), to = $$('input', sheet);
        to.forEach(function (x, i) { x.removeAttribute('id'); if (from[i] && from[i].checked) { x.setAttribute('checked', ''); x.checked = true; } });
      }
      $$('.rd-sheet').forEach(function (x) { x.parentNode.removeChild(x); });
      document.body.appendChild(sheet);
      H.classList.add('rd-print-' + what);
      var done = function () { H.classList.remove('rd-print-' + what); if (sheet.parentNode) { sheet.parentNode.removeChild(sheet); } window.removeEventListener('afterprint', done); };
      window.addEventListener('afterprint', done);
      try { window.print(); } catch (e) { done(); }
      setTimeout(done, 60000);
    });
  });

  // two taps to clear: a button with data-arm asks once more, in place (no browser dialog)
  function armed(btn, word, act) {
    var plain = btn.textContent;
    btn.addEventListener('click', function () {
      if (btn.classList.contains('rd-armed')) {
        clearTimeout(btn._t); btn.classList.remove('rd-armed'); btn.textContent = plain; act(); return;
      }
      btn.classList.add('rd-armed'); btn.textContent = word;
      btn._t = setTimeout(function () { btn.classList.remove('rd-armed'); btn.textContent = plain; }, 4000);
    });
  }
  var pc = $('#rd-plan-clear');
  if (pc) { armed(pc, W.arm, function () { S.p = {}; planFields.forEach(function (f) { f.value = ''; }); save(); }); }
  var ca = $('#rd-clear');
  if (ca) {
    armed(ca, W.clear_arm, function () {
      S = fresh(); S.L = 0; setKeep(false); wipe();      // in this order: setKeep writes the object it is handed, so it must be the empty one
      var kp = $('#rd-keep'); if (kp) { kp.checked = false; }
      planFields.forEach(function (f) { f.value = ''; });
      $$('.rd-myth, .rd-drill').forEach(function (x) { x.classList.remove('rd-done', 'rd-ok', 'rd-no'); });
      $$('.rd-opt, [data-tf]').forEach(function (x) { x.classList.remove('rd-pick', 'rd-right', 'rd-wrongpick'); x.removeAttribute('aria-pressed'); });
      kit(); bestLine(); paint(true);
      var m = $('#rd-cleared'); if (m) { m.textContent = W.cleared; }
    });
  }
  var kp = $('#rd-keep');
  if (kp) { kp.checked = keep; }

  // ------------------------------------------------------------------ share (guide page): the system share sheet, else copy the link
  var sh = $('#rd-share');
  if (sh) {
    sh.addEventListener('click', function () {
      var url = location.href.split('#')[0], t = sh.getAttribute('data-title') || document.title;
      if (navigator.share) { navigator.share({ title: t, text: t, url: url }).catch(function () { }); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { toast(W.copied); }, function () { toast(url); });
      } else { toast(url); }
    });
  }

  // ------------------------------------------------------------------ the offline copy (only on the reader's press)
  var sv = $('#rd-save'), st = $('#rd-save-st');
  function say(t) { if (st) { st.textContent = t; } }
  function savedState() { if (sv) { sv.classList.add('rd-saved'); } say(W.save_done); }
  if (sv && sv.tagName === 'BUTTON') {
    try {
      if (window.caches && navigator.serviceWorker) {
        // saved means THIS page is in this build's copy (fa/ready/ and en/ready/ share the cache name, so the cache alone says nothing)
        caches.has(D.cache).then(function (h) {
          return h && caches.open(D.cache).then(function (c) { return c.match(new URL(D.scope || './', location.href).href); });
        }).then(function (m) { if (m) { savedState(); } }).catch(function () { });
      }
    } catch (e) { /* no cache in this browser */ }
    var listening = false;
    sv.addEventListener('click', function () {
      if (!('serviceWorker' in navigator) || !window.caches) { say(W.save_none); return; }
      sv.classList.remove('rd-saved');
      sv.classList.add('rd-busy');
      say(fmt(W.save_prog, { n: 0, t: 0 }));
      if (!listening) {
        listening = true;
        navigator.serviceWorker.addEventListener('message', function (ev) {
          var m = ev.data;
          if (!m || !m.rd) { return; }
          if (m.rd === 'p') { say(fmt(W.save_prog, { n: m.n, t: m.t })); }
          else if (m.rd === 'done') { sv.classList.remove('rd-busy'); savedState(); }
          else if (m.rd === 'fail') { sv.classList.remove('rd-busy'); say(W.save_fail); }
        });
        if (navigator.serviceWorker.startMessages) { navigator.serviceWorker.startMessages(); }
      }
      navigator.serviceWorker.register(D.sw, { scope: D.scope }).then(function (reg) {
        var w = reg.installing || reg.waiting;
        if (w) {
          w.addEventListener('statechange', function () { if (w.state === 'redundant') { sv.classList.remove('rd-busy'); say(W.save_fail); } });
        } else if (reg.active) {
          reg.active.postMessage('fill');      // saved before: fetch everything again, into this build's copy
        }
      }).catch(function (err) {
        sv.classList.remove('rd-busy');
        say(/Security|insecure|denied|disabled|not allowed/i.test(String(err && (err.name + ' ' + err.message))) ? W.save_private : W.save_fail);
      });
    });
  }

  paint(true);
}());
