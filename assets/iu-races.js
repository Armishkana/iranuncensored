/* The US races on iranuncensored.com (<lang>/races/usa/, build/elections.py, 6 November 2026): the three filters over the
   page the build printed. Without scripts every race is on the page; with them a reader narrows it to one chamber, one
   state or one name. Nothing is sent anywhere and nothing is kept: the filters live in this page only. */
(function () {
  'use strict';
  var D = document, root = D.getElementById('ue');
  if (!root) return;
  var cfg = {};
  try { cfg = JSON.parse(D.getElementById('ue-cfg').textContent); } catch (e) { }
  var chs = [].slice.call(root.querySelectorAll('.ue-ch')), st = D.getElementById('ue-st'), q = D.getElementById('ue-q'), out = D.getElementById('ue-n'), none = D.getElementById('ue-none');
  var races = [].slice.call(root.querySelectorAll('.ue-r')), states = [].slice.call(root.querySelectorAll('.ue-hs'));
  var sen = D.getElementById('ue-sen'), house = D.getElementById('ue-house');
  var S = { ch: '', st: '', q: '' };
  function dig(n) { var s = String(n); return cfg.fa ? s.replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.charAt(+d); }) : s; }
  function fold(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/‌/g, ' ').trim(); }
  function names(r) { return [].map.call(r.querySelectorAll('.ue-c'), function (c) { return fold(c.getAttribute('data-n')); }).join(' | '); }
  var index = races.map(function (r) { return { el: r, st: r.getAttribute('data-st'), ch: r.getAttribute('data-ch'), n: names(r) }; });
  function draw() {
    var q0 = fold(S.q), shown = 0, inState = {};
    index.forEach(function (x) {
      var ok = (!S.ch || x.ch === S.ch) && (!S.st || x.st === S.st) && (!q0 || x.n.indexOf(q0) >= 0);
      x.el.hidden = !ok;
      if (ok) { shown++; if (x.ch === 'h') inState[x.st] = (inState[x.st] || 0) + 1; }
    });
    states.forEach(function (d) {
      var k = inState[d.getAttribute('data-st')] || 0;
      d.hidden = !k;
      if (S.st || q0) d.open = k > 0;          // a state or a name picked: its seats open by themselves
    });
    sen.hidden = S.ch === 'h' || !index.some(function (x) { return x.ch === 's' && !x.el.hidden; });
    house.hidden = S.ch === 's' || !Object.keys(inState).length;
    out.textContent = (cfg.n || '{n}').replace('{n}', dig(shown));
    none.hidden = shown > 0;
    if (!shown) none.textContent = cfg.none || '';
  }
  chs.forEach(function (b) {
    b.addEventListener('click', function () {
      S.ch = b.getAttribute('data-ch') || '';
      chs.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      draw();
    });
  });
  st.addEventListener('change', function () { S.st = st.value; draw(); });
  q.addEventListener('input', function () { S.q = q.value; draw(); });
  // ?st=TX opens one state (a link from a member's page or a share)
  var m = /[?&]st=([A-Za-z]{2})\b/.exec(location.search);
  if (m && st.querySelector('option[value="' + m[1].toUpperCase() + '"]')) { st.value = m[1].toUpperCase(); S.st = st.value; }
  draw();
  root.classList.add('is-live');
})();
