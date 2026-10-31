/* Your score on Iran (you/, 31 October 2026). A reader votes on the votes the Iran Scorecard counts and gets a score out of
   100 on the same scale as every member of Congress, the principles one by one, and the members closest to them.
   NOTHING HERE LEAVES THE PAGE: no answer is sent, stored (no cookie, no storage) or written into the address. Posts and
   readers on this site can be inside Iran (LIVING.md). The one thing read is assets/you.json, from this site, every scored
   member's score on each principle, and only once the reader asks for a result.
   This file holds no editorial decision: the questions, the free side of each, what each weighs, the principles, their weights
   and how many answers each needs are printed into the page by render.py (you_page) from data/register.json, and the sum is
   build/score.py's (Liberty Politics' weighted_total). Tested in build/phone-test.html (part you). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var cfgEl = $('sq-cfg'), list = $('sq');
  if (!cfgEl || !list) return;
  var C = JSON.parse(cfgEl.textContent), W = C.words;
  var root = document.documentElement.getAttribute('data-root') || '../../';
  var items = Array.prototype.slice.call(list.querySelectorAll('.sq-i'));
  var ans = [], shown = false, data = null, asked = false;
  var go = $('sq-go'), left = $('sq-left'), res = $('sq-res'), sel = $('sq-state');
  var MS = {};
  C.ms.forEach(function (m) { MS[m.k] = m; });

  /* A number as the page writes it: Persian digits and the Persian decimal mark on a Persian page. */
  function fn(x) {
    var s = String(x);
    return C.fa ? s.replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.charAt(+d); }).replace('.', '٫') : s;
  }
  function say(k, o) {
    return W[k].replace(/\{(\w+)\}/g, function (all, n) { return o && o[n] != null ? (typeof o[n] === 'number' ? fn(o[n]) : o[n]) : all; });
  }
  function shownOf(s) { return Math.floor(s + 0.5); }      // render.py shown(): a whole number, halves up
  function bandOf(n) {
    for (var i = 0; i < C.bands.length; i++) if (n >= C.bands[i][0]) return C.bands[i][1];
    return 'f';
  }

  /* The sum every member gets (build/score.py): each principle is the weighted share of the answers on the free side (a key
     vote weighs 2), to one decimal; it counts once it has as many answers as a member needs (min); the score is the average
     of the principles that count, weighted by each one's weight, to one decimal; and without the gate principle, no score. */
  function tally() {
    var by = {}, done = 0, n = 0, ok = 0;
    C.ms.forEach(function (m) { by[m.k] = { n: 0, wAll: 0, wWith: 0 }; });
    items.forEach(function (li, i) {
      if (ans[i]) done++;
      if (ans[i] !== 'yea' && ans[i] !== 'nay') return;
      var b = by[li.getAttribute('data-m')], w = +li.getAttribute('data-w') || 1;
      if (!b) return;
      b.n++; b.wAll += w; n++;
      if (ans[i] === li.getAttribute('data-side')) { b.wWith += w; ok++; }
    });
    var sum = 0, wt = 0;
    C.ms.forEach(function (m) {
      var b = by[m.k];
      b.counts = b.n >= m.min && b.wAll > 0;
      b.score = b.wAll ? Math.round(1000 * b.wWith / b.wAll) / 10 : null;
      if (b.counts) { sum += b.score * m.w; wt += m.w; }
    });
    var score = by[C.gate].counts && wt ? Math.round(10 * sum / wt) / 10 : null;
    return { by: by, done: done, n: n, ok: ok, score: score };
  }

  function progress(t) {
    go.disabled = t.score == null;
    if (t.score == null) left.textContent = say('need', { min: MS[C.gate].min, tag: C.tag, left: MS[C.gate].min - t.by[C.gate].n });
    else if (t.done < items.length) left.textContent = say('some', { done: t.done, n: items.length });
    else left.textContent = say('all', { n: items.length });
  }

  function el(tag, cls, text) {
    var x = document.createElement(tag);
    if (cls) x.className = cls;
    if (text != null) x.textContent = text;
    return x;
  }

  function stamp(n, small) {
    var s = el('span', 'g g-' + bandOf(n) + (small ? ' g-sm' : '') + (n === 100 ? ' g-3' : ''), fn(n));
    s.setAttribute('aria-hidden', 'true');
    return s;
  }

  /* One member, drawn like a row of the scorecard (render.py row()), with how close they are to the reader. */
  function row(m) {
    var li = el('li', 'mrow'), a = el('a');
    a.href = C.here + 'members/' + m.slug + '/';
    var f;
    if (m.face) {
      f = el('img', 'face');
      f.src = root + 'assets/p/' + m.face + '.jpg'; f.alt = ''; f.width = 60; f.height = 73; f.decoding = 'async';      // not lazy: eight rows, drawn only after a tap
    } else {
      var w = m.en.split(' ');
      f = el('span', 'face noface', (w[0].charAt(0) + w[w.length - 1].charAt(0)).toUpperCase());
      f.setAttribute('aria-hidden', 'true');
    }
    var who = el('span', 'who'), b = el('b'), bd = el('bdi', null, m.name);
    b.appendChild(bd); who.appendChild(b);
    who.appendChild(el('small', null, [m.chamber === 'S' ? W.sen : W.rep, W[m.party], C.states[m.state] || m.state].join(W.sep)));
    who.appendChild(el('small', 'sq-m', say('match', { x: m.match })));
    var n = shownOf(m.score), sc = el('span', 'sc');
    sc.appendChild(stamp(n, true));
    sc.appendChild(el('small', 'num', W.of100));
    a.appendChild(f); a.appendChild(who); a.appendChild(sc);
    a.setAttribute('aria-label', say('rowAria', { name: m.name, s: n, x: m.match }));
    li.appendChild(a);
    return li;
  }

  function fill(ul, rows) {
    while (ul.firstChild) ul.removeChild(ul.firstChild);
    rows.forEach(function (m) { ul.appendChild(row(m)); });
  }

  /* How close a member is to the reader: on every principle both have a score on, the distance between the two, weighted by
     the principle's weight, taken from 100. The gate principle is always shared: every scored member has it. */
  function compare(t) {
    var idx = {};
    data.measures.forEach(function (k, i) { idx[k] = i; });
    return data.members.map(function (r) {
      var d = 0, w = 0;
      C.ms.forEach(function (m) {
        var mine = t.by[m.k], theirs = r[7][idx[m.k]];
        if (mine.counts && theirs != null) { d += m.w * Math.abs(mine.score - theirs); w += m.w; }
      });
      return { slug: r[0], en: r[1], name: C.fa ? r[2] : r[1], party: r[3], state: r[4], chamber: r[5], score: r[6], face: r[8],
               match: w ? Math.round(100 - d / w) : null };
    });
  }

  function people(t) {
    var all = compare(t), ok = all.filter(function (m) { return m.match != null; });
    var by = function (dir) {
      return function (a, b) { return dir * (b.match - a.match) || (a.en < b.en ? -1 : 1); };
    };
    fill($('sq-near'), ok.slice().sort(by(1)).slice(0, 5));
    fill($('sq-far'), ok.slice().sort(by(-1)).slice(0, 3));
    var lower = all.filter(function (m) { return m.score < t.score; }).length;
    $('sq-rank').textContent = lower === 0 ? W.rank0 : lower === all.length ? say('rankAll', { m: all.length }) : say('rank', { x: lower, m: all.length });
    $('sq-like-p').textContent = W.like;
    $('sq-like').hidden = false;
    mineIn(all);
  }

  function mineIn(all) {
    var st = (sel.value || '').toUpperCase(), rows = st ? all.filter(function (m) { return m.state === st && m.match != null; }) : [];
    rows.sort(function (a, b) { return (a.chamber === b.chamber ? 0 : a.chamber === 'S' ? -1 : 1) || (a.en < b.en ? -1 : 1); });
    fill($('sq-mine'), rows);
  }

  function breakdown(t) {
    Array.prototype.forEach.call(document.querySelectorAll('#sq-ms li[data-k]'), function (li) {
      var k = li.getAttribute('data-k'), b = t.by[k], v = li.querySelector('[data-v]'), bar = li.querySelector('.sq-bar i');
      if (!b || !v) return;
      if (b.counts) v.textContent = say(b.n === 1 ? 'mOk1' : 'mOk', { s: shownOf(b.score), n: b.n });
      else if (b.n) v.textContent = say('mNone', { left: MS[k].min - b.n });
      else v.textContent = W.mSkip;
      if (bar) bar.style.width = (b.counts ? b.score : 0) + '%';
    });
  }

  function result() {
    var t = tally();
    progress(t);
    if (!shown) return;
    if (t.score == null) { res.hidden = true; shown = false; return; }
    var s = shownOf(t.score), g = $('sq-g');
    g.textContent = fn(s);
    g.className = 'g g-' + bandOf(s) + (s === 100 ? ' g-3' : '');
    g.setAttribute('aria-label', say('aria', { s: s }));
    $('sq-h').textContent = say('h', { s: s });
    $('sq-p').textContent = say(t.n === 1 ? 'p1' : 'p', { s: s, ok: t.ok, n: t.n });
    breakdown(t);
    items.forEach(function (li, i) {
      var a = ans[i], side = li.getAttribute('data-side'), you = li.querySelector('.sq-you');
      li.classList.remove('sq-with', 'sq-against');
      if (a === 'yea' || a === 'nay') {
        li.classList.add(a === side ? 'sq-with' : 'sq-against');
        you.textContent = W[a + (a === side ? '' : 'X')];
      } else you.textContent = a === 'skip' ? W.skip : W.none;
      li.querySelector('.sq-a').hidden = false;
    });
    res.hidden = false;
    if (data) people(t);
    else if (!asked) {
      asked = true;
      fetch(root + 'assets/you.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) { data = d; var t2 = tally(); if (shown && t2.score != null) people(t2); })
        .catch(function () { asked = false; });      // the score stands without the comparison; the next change asks again
    }
  }

  items.forEach(function (li, i) {
    Array.prototype.forEach.call(li.querySelectorAll('.sq-v'), function (b) {
      b.addEventListener('click', function () {
        ans[i] = b.getAttribute('data-v');
        Array.prototype.forEach.call(li.querySelectorAll('.sq-v'), function (o) {
          var on = o === b;
          o.classList.toggle('on', on);
          o.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        result();
        if (shown) return;
        /* Bring the next question not yet answered into view; after the last one, the button. */
        var next = null;
        for (var j = i + 1; j < items.length && !next; j++) if (!ans[j]) next = items[j];
        var to = next || $('sq-end');
        try { to.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }); } catch (x) { to.scrollIntoView(); }
      });
    });
  });

  go.addEventListener('click', function () {
    if (tally().score == null) return;
    shown = true;
    result();
    try { res.scrollIntoView({ behavior: 'auto', block: 'start' }); } catch (x) { res.scrollIntoView(); }
  });

  if (sel) sel.addEventListener('change', function () { if (data && shown) { var t = tally(); if (t.score != null) mineIn(compare(t)); } });

  progress(tally());
  window.IUYou = { tally: tally, compare: function () { return data ? compare(tally()) : null; } };      // read by the phone test
})();
