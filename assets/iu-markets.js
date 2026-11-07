/* Beat the Markets on iranuncensored.com (<lang>/markets/, build/markets_iu.py, 6 November 2026).
   A reader's call is kept in THIS browser only (localStorage "iu-calls"): no account, nothing sent, nothing loaded from
   another server. A call is scored here, by the rule of ../../site/CALLS.md: right = 100 x (1 - p), wrong = -100 x p, p the
   market's price for the option when it was called. The words come from the page (#mk-data .w). */
(function () {
  'use strict';
  var D = document, box = D.getElementById('mk-iu');
  if (!box) return;
  var P;
  try { P = JSON.parse(D.getElementById('mk-data').textContent); } catch (e) { return; }
  var KEY = 'iu-calls', T = P.w, by = {};
  P.m.forEach(function (m) { by[m.id] = m; });
  function $(id) { return D.getElementById(id); }
  function dig(n) { var s = String(n); return P.fa ? s.replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.charAt(+d); }) : s; }
  function pct(p) { var v = Math.round(p * 100); return P.fa ? dig(v) + '٪' : v + '%'; }
  function fill(s, v) { return String(s).replace(/\{(\w+)\}/g, function (x, k) { return k in v ? v[k] : x; }); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save(c) { try { if (Object.keys(c).length) localStorage.setItem(KEY, JSON.stringify(c)); else localStorage.removeItem(KEY); } catch (e) { } }
  var C = load(), tab = 'all';
  function label(m, i) { var o = (m.o || []).filter(function (x) { return x[0] === i; })[0]; return o ? o[1] : ''; }
  function points(m, c) { if (m.st !== 'resolved' || m.win === null || m.win === undefined) return null; return m.win === c.i ? Math.round(100 * (1 - c.p)) : -Math.round(100 * c.p); }
  function sign(n) { return (n > 0 ? '+' : n < 0 ? '−' : '') + dig(Math.abs(n)); }
  function card(m) {
    var el = $('m-' + m.id);
    if (!el) return;
    var c = C[m.id];
    [].forEach.call(el.querySelectorAll('.mk-o'), function (b) { b.setAttribute('aria-pressed', c && +b.getAttribute('data-i') === c.i ? 'true' : 'false'); });
    var you = el.querySelector('.mk-you');
    you.hidden = !c;
    if (c) you.textContent = fill(T.you, { o: label(m, c.i) || '', p: pct(c.p) });
  }
  function record() {
    var ks = Object.keys(C), pts = 0, right = 0, wrong = 0, open = 0, lis = '';
    ks.forEach(function (id) {
      var m = by[id], c = C[id];
      if (!m) { lis += '<li><b>' + T.gone + '</b></li>'; return; }
      var n = points(m, c);
      if (n === null) open++;
      else { pts += n; if (n > 0) right++; else wrong++; }
      var line = n === null ? fill(T.you, { o: label(m, c.i), p: pct(c.p) }) : fill(n > 0 ? T.you_won : T.you_lost, { o: label(m, c.i), pts: sign(n) });
      lis += '<li><b>' + esc(m.q) + '</b><span>' + esc(line) + (m.st === 'resolved' ? ' ' + esc(fill(T.closed, { o: m.wl })) : '') + '</span></li>';
    });
    $('mk-pts').textContent = sign(pts);
    $('mk-rec-s').textContent = ks.length ? fill(T.rec_n, { n: dig(ks.length), open: dig(open), right: dig(right), wrong: dig(wrong) }) : T.rec_0;
    $('mk-rec-l').innerHTML = lis;
    $('mk-clear').hidden = !ks.length;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x]; }); }
  function filter() {
    var shown = 0;
    [].forEach.call(box.querySelectorAll('.mk-c'), function (el) {
      var ok = tab === 'all' || (tab === 'mine' ? !!C[el.getAttribute('data-id')] : el.getAttribute('data-k') === tab);
      el.hidden = !ok; if (ok) shown++;
    });
    $('mk-none').hidden = shown > 0;
    if (!shown) $('mk-none').textContent = T.rec_0;
    [].forEach.call(box.querySelectorAll('.mk-tab'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-k') === tab ? 'true' : 'false'); });
  }
  box.addEventListener('click', function (ev) {
    var b = ev.target.closest('button');
    if (!b || !box.contains(b)) return;
    if (b.classList.contains('mk-o')) {
      var el = b.closest('.mk-c'), id = el.getAttribute('data-id'), i = +b.getAttribute('data-i'), p = +b.getAttribute('data-p');
      if (C[id] && C[id].i === i) delete C[id];          // a second tap on your call takes it back
      else C[id] = { i: i, p: p, t: new Date().toISOString().slice(0, 10) };
      save(C); card(by[id]); record(); if (tab === 'mine') filter();
    } else if (b.classList.contains('mk-tab')) { tab = b.getAttribute('data-k'); filter(); }
    else if (b.id === 'mk-clear') { C = {}; save(C); P.m.forEach(card); record(); filter(); $('mk-rec-s').textContent = T.cleared; }
  });
  P.m.forEach(card);
  record();
  filter();
  box.classList.add('is-live');
})();
