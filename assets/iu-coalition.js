/* Build Israel's next government, on iranuncensored.com (<lang>/races/israel/, build/elections.py, 6 November 2026).
   The same calculator as Liberty Politics' (../../site/build/coalition.js), written again for this site so every sentence it
   writes is in the page's language (the words come from the page, #il-data .w) and nothing reaches another server: no
   betting markets, no account, no picture service. The government a reader builds rides in the address (?gov=&out=) and
   nowhere else.
   Tap a party: it joins the government. Tap Outside: it keeps the government alive without joining it. The chamber, the
   count, the bar to the majority, the sentence under it and the red lines the government breaks follow at once. Every
   government that reaches the majority is listed once, the ones that break the fewest stated red lines first. */
(function () {
  'use strict';
  var D = document, W = window, box = D.getElementById('il');
  if (!box) return;
  var P;
  try { P = JSON.parse(D.getElementById('il-data').textContent); } catch (e) { return; }
  var T = P.w, by = {}, ids = P.parties.map(function (p) { by[p.id] = p; return p.id; });
  var gov = {}, out = {};
  function $(id) { return D.getElementById(id); }
  function dig(n) { var s = String(n); return P.fa ? s.replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.charAt(+d); }) : s; }
  function fill(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function sum(set) { var n = 0; for (var k in set) if (set[k]) n += by[k].seats; return n; }
  function list(set) { return ids.filter(function (k) { return set[k]; }); }
  function has(set, ks) { return (ks || []).some(function (k) { return set[k]; }); }
  // the stated red lines a government breaks: g the parties in it, o the ones keeping it alive from outside
  function broken(g, o) {
    var outl = [];
    P.lines.forEach(function (l) {
      if (!(g[l.party] || o[l.party])) return;
      if (l.kind === 'wont-sit-with' && g[l.party] && (has(g, l.targets) || (l.alsoOutside && has(o, l.targets)))) outl.push(l);
      else if (l.kind === 'only-with' && g[l.party] && !has(g, l.targets)) outl.push(l);
    });
    return outl;
  }
  function addr() {
    try {
      var u = new URL(location.href), g = list(gov), o = list(out);
      if (g.length) u.searchParams.set('gov', g.join(',')); else u.searchParams.delete('gov');
      if (o.length) u.searchParams.set('out', o.join(',')); else u.searchParams.delete('out');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) { }
  }
  function draw() {
    var n = sum(gov), o = sum(out), any = n + o > 0, maj = P.majority;
    [].forEach.call(box.querySelectorAll('.il-dots circle'), function (c) {
      var k = c.getAttribute('data-p');
      c.setAttribute('class', !any ? '' : gov[k] ? '' : out[k] ? 'is-o' : 'is-off');
    });
    $('il-n').textContent = dig(any ? n : P.seats);
    $('il-bar').style.width = (n / P.seats * 100) + '%';
    $('il-bar-o').style.width = ((n + o) / P.seats * 100) + '%';
    var say;
    if (!any) say = T.start;
    else if (n >= maj) {
      var big = list(gov).sort(function (a, b) { return by[b].seats - by[a].seats; })[0];
      say = fill(n > maj ? T.win : T.win0, { n: dig(n), k: dig(n - maj) }) + ' ' + fill(T.pm, { who: by[big].leader, party: by[big].name });
    } else if (o && n + o >= maj) say = fill(T.minority, { n: dig(n), o: dig(o), t: dig(n + o) });
    else say = fill(T.gov, { n: dig(n), m: dig(maj) }) + ' ' + fill(T.more, { k: dig(maj - n - o) });
    $('il-say').textContent = say;
    var w = broken(gov, out);
    $('il-warn').innerHTML = w.map(function (l) {
      var words = l.says ? esc(l.says) : esc(fill(T.line_fa, { party: by[l.party].name })) + ' <span lang="en" dir="ltr">' + esc(l.en) + '</span>';
      return '<li class="' + (l.soft ? 'is-soft' : '') + '"><b>' + esc(l.soft ? T.cond : T.breaks) + '</b>' + words +
        ' <a class="ue-src" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + esc(T.source) + '</a></li>';
    }).join('');
    ids.forEach(function (k) {
      var row = box.querySelector('.il-row[data-id="' + k + '"]');
      row.querySelector('.il-pick').setAttribute('aria-pressed', gov[k] ? 'true' : 'false');
      row.querySelector('.il-out').setAttribute('aria-pressed', out[k] ? 'true' : 'false');
    });
    $('il-reset').hidden = !any;
    var key = list(gov).join(',') + '|' + list(out).join(',');
    [].forEach.call(box.querySelectorAll('.il-pre'), function (b) {
      var pr = P.presets.filter(function (x) { return x.id === b.getAttribute('data-pre'); })[0];
      var pk = pr ? ids.filter(function (k) { return pr.gov.indexOf(k) >= 0; }).join(',') + '|' + ids.filter(function (k) { return (pr.out || []).indexOf(k) >= 0; }).join(',') : '';
      b.setAttribute('aria-pressed', pk === key ? 'true' : 'false');
    });
    addr();
  }
  function set(g, o) {
    gov = {}; out = {};
    (g || []).forEach(function (k) { if (by[k]) gov[k] = true; });
    (o || []).forEach(function (k) { if (by[k] && !gov[k]) out[k] = true; });
    draw();
  }
  box.addEventListener('click', function (ev) {
    var b = ev.target.closest('button');
    if (!b || !box.contains(b)) return;
    var k = b.getAttribute('data-id');
    if (b.classList.contains('il-pick')) { gov[k] = !gov[k]; if (gov[k]) out[k] = false; draw(); }
    else if (b.classList.contains('il-out')) { out[k] = !out[k]; if (out[k]) gov[k] = false; draw(); }
    else if (b.classList.contains('il-pre')) { var pr = P.presets.filter(function (x) { return x.id === b.getAttribute('data-pre'); })[0]; if (pr) set(pr.gov, pr.out); }
    else if (b.classList.contains('il-way')) { set((b.getAttribute('data-gov') || '').split(','), []); var st = $('il-stage'); if (st && st.scrollIntoView) st.scrollIntoView({ block: 'start' }); }
    else if (b.id === 'il-reset') set([], []);
  });
  // every government that reaches the majority with no party it could do without (11 parties: 2,048 teams, counted once)
  var ways = [], nP = ids.length;
  for (var mask = 1; mask < (1 << nP); mask++) {
    var g = {}, seats = 0, smallest = 1e9;
    for (var i = 0; i < nP; i++) if (mask & (1 << i)) { g[ids[i]] = true; seats += by[ids[i]].seats; smallest = Math.min(smallest, by[ids[i]].seats); }
    if (seats < P.majority || seats - smallest >= P.majority) continue;
    ways.push({ g: list(g), seats: seats, bad: broken(g, {}).filter(function (l) { return !l.soft; }).length });
  }
  ways.sort(function (a, b) { return (a.bad - b.bad) || (a.g.length - b.g.length) || (a.seats - b.seats); });
  $('il-ways').innerHTML = ways.slice(0, 8).map(function (w) {
    return '<li><button type="button" class="il-way ' + (w.bad ? 'is-bad' : 'is-ok') + '" data-gov="' + w.g.join(',') + '"><b>' +
      w.g.map(function (k) { return esc(by[k].name); }).join(P.fa ? '، ' : ', ') + '</b><span><span class="num">' + dig(w.seats) + '</span> ' + esc(T.seats) + ' · <span class="il-wk">' +
      esc(w.bad ? fill(T.way_bad, { k: dig(w.bad) }) : T.way_ok) + '</span></span></button></li>';
  }).join('');
  var q = new URLSearchParams(location.search);
  set((q.get('gov') || '').split(',').filter(Boolean), (q.get('out') || '').split(',').filter(Boolean));
  box.classList.add('is-live');
})();
