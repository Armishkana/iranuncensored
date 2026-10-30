/* WHO IS SPEAKING (site-iu/build/news-camps.js, 23 October 2026; Ground News for Iran, 24 October 2026). Iran Uncensored's
   Intel Room only: build/news.py names it in the room's data-addons beside intel-forces.js, and hands its data as CFG.camps
   (from data/media-camps.json, in the page's language). The feed's fields it reads are written hourly by
   ../../site/build/intel_live.py --site iu: cb (the camp of the outlet, channel or account), ca (its other camps, Tasnim's
   'also' Ghalibaf), sb (a story's outlets counted by group), sbn (their names by camp), bz 'rg' (a story only the regime's
   media tells) or 'hid' (a Persian story about repression free media told and none of the regime's outlets did), rx (the X
   posts about a story), ce and cs (the evidence for an X account's stance: its own words, read by hand 'p' or by the room 'a').

   Armin, 23 Oct 2026: "Every analysis, every news item, and every article should be categorized in a ground news way, with
   the media clearly marked with its bias: if it's from the Islamic Republic, which part of the Islamic Republic ..."
   and 24 Oct: "I should be able to go see all the news that is associated with media connected to the Paydari camp if I
   want to filter for that ... Or I should be able to filter for all the pro-Pahlavi posts on all the X posts from
   pro-Pahlavi accounts or from anti-Pahlavi ... The Ground News feature version of Iran Uncensored would not be left and
   right. It would be basically based on these ideological lines."

   WHAT IT ADDS
   1. WHO IS SPEAKING, a door on the room's bar beside Topic and Region. It opens a picker: Without the regime's media, the
      two blind spots, then every group (the Islamic Republic, the opposition, foreign-funded, independent, world press,
      people on X) with its count, each opening to its camps (IRGC, the Leader's office, Paydari, Ghalibaf's circle ...,
      backs Prince Reza Pahlavi, against him; world press by its left, centre or right lean). Tap one or several: they add up (OR).
      The choice is ?side= in the address (free | <group> | c:<camp>, comma between several), so a view can be shared.
      A camp finds what its outlets say AND every story they are among the tellers of (media-camps.json _rules).
   2. On every story card in the list: a thin bar of who told it, by group, like Ground News, read aloud by its label.
   3. IRAN'S BLIND SPOTS, ?bz=rg | hid: "Regime only" and "What the regime hides", as chips in the Trending row (where
      Liberty Politics' room keeps its Blindspots chip) and at the top of the picker.
   4. A camp mark on every card (IRoom.addBadge); regime camps are filled red.
   5. In every spotlight, WHO IS TELLING THIS STORY (the bar, each outlet under its camp and why), what X says about it,
      and for a person on X the words of their own that the stance label was read from.
   6. The Media tab beside Stories: every camp, what it is, how many items of it the room holds now, every outlet the room
      knows under it with the reason, and one tap to show only that camp. People on X are counted, never listed.
   Nothing here decides a label: every camp is the file's, every count is counted. Every sentence goes through T() and
   news.py t_keys() reads this file, so the Persian build stops while one has no spoken Persian. */
(function () {
  'use strict';
  var R = window.IRoom, root = document.getElementById('ir');
  if (!R || !root || window.IUC) return;
  var CFG = (function () { var el = document.getElementById('ir-cfg'); if (!el) return {}; try { var c = JSON.parse(el.textContent); return c && typeof c === 'object' ? c : {}; } catch (e) { return {}; } })();
  var C = CFG.camps;
  if (!C || !C.camps) return;
  window.IUC = true;
  var $ = function (id) { return document.getElementById(id); };
  var TT = CFG.t && typeof CFG.t === 'object' ? CFG.t : null, FA = CFG.lang === 'fa';
  function T(s, v) { var r = TT && typeof TT[s] === 'string' ? TT[s] : s; if (v) Object.keys(v).forEach(function (k) { r = r.split('{' + k + '}').join(String(v[k])); }); return r; }
  function N(n) { var s = String(n); return FA ? s.replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.charAt(+d); }).replace(/,/g, '٬') : s; }          // a thousands comma in Persian too
  function safeU(u) { u = String(u || '').trim(); return /^https?:\/\//i.test(u) ? u : '#'; }          // a feed's link: only http and https
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function unent(t) { return String(t || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }          // X sends some text already escaped
  function bd(h) { return '<bdi>' + h + '</bdi>'; }
  var SEP = FA ? '، ' : ', ';
  var GROUPS = C.groups || [], GI = {};          // [[key, label, colour]]
  GROUPS.forEach(function (g, i) { GI[g[0]] = i; });
  var CAMPS = Object.keys(C.camps).filter(function (k) { return k !== 'mek'; });
  function camp(k) { return C.camps[k] || C.camps.un || ['', 'un', '#6B6B6B', '']; }          // [label, group, colour, why]
  function groupOf(it) { return it && it.cb ? camp(it.cb)[1] : 'un'; }
  function pill(k, extra) {
    var c = camp(k);
    return '<span class="iuc' + (c[1] === 'rg' ? ' iuc-rg' : '') + (extra ? ' ' + extra : '') + '" style="--cc:' + esc(c[2]) + '">' + esc(c[0]) + '</span>';
  }
  function sure(o) { return o === 'reported' ? T('reported') : o === 'posts' ? T('read from their own posts') : T('public record'); }
  var PEOPLE = /^x_|^person$|^lingo$/;          // camps of people on X: counted, never listed (media-camps.json _people)

  /* ---------------------------------------------------------------- who told it: one test for the filter and the counts */
  function told(it, tok) {
    if (!it) return false;
    if (tok === 'free') return groupOf(it) !== 'rg' && !(R.regime && R.regime(it));          // the room's own regime test too: an item of a regime host with no camp yet is not free
    if (tok.indexOf('c:') === 0) {
      var k = tok.slice(2);
      return it.cb === k || (it.ca || []).indexOf(k) >= 0 || !!(it.sbn && it.sbn[k]);
    }
    if (groupOf(it) === tok || (it.sb && it.sb[tok] > 0)) return true;
    return (it.ca || []).some(function (k) { return camp(k)[1] === tok; });
  }
  function tokens(v) { return String(v || '').split(',').filter(Boolean); }
  function validTok(t) { return t === 'free' || GI[t] != null || (t.indexOf('c:') === 0 && !!C.camps[t.slice(2)] && t !== 'c:mek'); }
  function tokLabel(t) {
    if (t === 'free') return T('Without the regime\'s media');
    if (t.indexOf('c:') === 0) return camp(t.slice(2))[0];
    return GROUPS[GI[t]] ? GROUPS[GI[t]][1] : t;
  }
  R.addFilter({ key: 'side',
    valid: function (v) { var ts = tokens(v); return ts.length > 0 && ts.length <= 12 && ts.every(validTok) && (ts.indexOf('free') < 0 || ts.length === 1); },
    test: function (it, v) { return tokens(v).some(function (t) { return told(it, t); }); },
    label: function (v) { return tokens(v).map(tokLabel).join(T(' or ')); } });
  R.addFilter({ key: 'bz', valid: function (v) { return v === 'rg' || v === 'hid'; }, test: function (it, v) { return it.bz === v; },
    label: function (v) { return v === 'rg' ? T('Regime only') : T('What the regime hides'); } });
  function sideOn() { return tokens(R.filterOn('side')); }
  function toggle(tok) {
    var ts = sideOn(), i = ts.indexOf(tok);
    if (tok === 'free') ts = i >= 0 ? [] : ['free'];
    else {
      ts = ts.filter(function (t) { return t !== 'free'; });
      if (i >= 0) ts.splice(ts.indexOf(tok), 1); else ts.push(tok);
    }
    R.filter('side', ts.join(','));
  }
  function count(tok) { var n = 0; R.items().forEach(function (it) { if (told(it, tok)) n++; }); return n; }
  function countBz(v) { var n = 0; R.items().forEach(function (it) { if (it.bz === v) n++; }); return n; }

  /* ---------------------------------------------------------------- 4. the mark on every card, 2. its coverage bar */
  R.addBadge(function (it) {
    if (!it || !it.cb) return '';
    var b = it.cb === 'person' || (it.src === 'X' && it.cb === 'un') ? '' : pill(it.cb);
    if (it.bz === 'rg') b += (b ? ' ' : '') + '<span class="iuc iuc-only">' + esc(T('Regime only')) + '</span>';
    if (it.bz === 'hid') b += (b ? ' ' : '') + '<span class="iuc iuc-hid">' + esc(T('Not in the regime\'s media')) + '</span>';
    return b;
  });
  function barWords(sb) {
    var tot = 0; GROUPS.forEach(function (g) { tot += sb[g[0]] || 0; });
    return T('{n} outlets told this story', { n: N(tot) }) + ': ' + GROUPS.filter(function (g) { return sb[g[0]]; }).map(function (g) { return g[1] + ' ' + N(sb[g[0]]); }).join(SEP);
  }
  function bar(sb, cls) {
    var tot = 0; GROUPS.forEach(function (g) { tot += sb[g[0]] || 0; });
    if (!tot) return '';
    return '<span class="iuc-bar' + (cls ? ' ' + cls : '') + '" role="img" aria-label="' + esc(barWords(sb)) + '" title="' + esc(barWords(sb)) + '">' + GROUPS.map(function (g) {
      return sb[g[0]] ? '<i style="flex:' + sb[g[0]] + ';background:' + esc(g[2]) + '"></i>' : '';
    }).join('') + '</span>';
  }
  function decorate() {          // every story card in the list gets its bar; the list is redrawn whole, so this runs on each draw
    var ol = $('ir-items'); if (!ol) return;
    var sh = R.shown();
    [].forEach.call(ol.querySelectorAll('.ir-card > button[data-i]'), function (b) {
      if (b.querySelector('.iuc-cov')) return;
      var it = sh[+b.getAttribute('data-i')];
      if (!it || it.src !== 'News' || !it.sb) return;
      // a card bar from one or two outlets is that outlet's own badge again, drawn as if it were a spread (25 Oct 2026,
      // the same floor as Liberty Politics' SPLIT_MIN in intel.js and intel_live.py LC_SOME); the spotlight still names them
      var tot = 0; GROUPS.forEach(function (g) { tot += it.sb[g[0]] || 0; }); if (tot < 3) return;
      var host = b.querySelector('.ir-c-m'); if (!host) return;
      var s = document.createElement('span'); s.className = 'iuc-cov'; s.innerHTML = bar(it.sb, 'iuc-bar-s');
      host.parentNode.insertBefore(s, host.nextSibling);
    });
  }
  (function () { var ol = $('ir-items'); if (ol && window.MutationObserver) new MutationObserver(decorate).observe(ol, { childList: true }); })();

  /* ---------------------------------------------------------------- 3. the blind spots in the Trending row */
  function hotChips() {
    var el = $('ir-hots'); if (!el || el.querySelector('.iuc-hc')) return;
    var on = R.filterOn('bz'), h = '';
    [['rg', 'Regime only'], ['hid', 'What the regime hides']].forEach(function (x) {
      var n = countBz(x[0]);
      if (!n && on !== x[0]) return;
      h += '<button type="button" class="ir-chip ir-hc iuc-hc iuc-hc-' + x[0] + '" data-iubz="' + x[0] + '" aria-pressed="' + (on === x[0]) + '" title="' +
        esc(x[0] === 'rg' ? T('Stories only the regime\'s media told. Read them as its claim.') : T('Stories about repression that free media told and none of the regime\'s outlets in this room did.')) + '">' +
        '<span>' + esc(x[0] === 'rg' ? T('Regime only') : T('What the regime hides')) + '</span> <i>' + N(n) + '</i></button>';
    });
    if (!h) return;
    var after = el.querySelector('.ir-hc-bs') || el.querySelector('.ir-hc-all');
    var tmp = document.createElement('span'); tmp.innerHTML = h;
    var ref = after ? after.nextSibling : el.firstChild;
    while (tmp.firstChild) el.insertBefore(tmp.firstChild, ref);
  }
  (function () {
    var el = $('ir-hots'); if (!el) return;
    if (window.MutationObserver) new MutationObserver(hotChips).observe(el, { childList: true });
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-iubz]'); if (!b) return;
      ev.stopPropagation();
      var v = b.getAttribute('data-iubz');
      R.filter('bz', R.filterOn('bz') === v ? '' : v);
    }, true);
  })();

  /* ---------------------------------------------------------------- 1. the door on the bar, and its picker */
  var OPEN = {};          // which groups the reader has opened in the picker, so a redraw keeps them open
  function door() {
    var bar0 = root.querySelector('.ir-cmd-b'); if (!bar0 || $('iuc-cb')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'iuc-cb'; b.className = 'ir-cb iuc-cb'; b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('title', T('Who is speaking'));          // the short word fits a phone's third of the bar beside Topic and Region
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11v2a2 2 0 0 0 2 2h1l4 4V5L6 9H5a2 2 0 0 0-2 2z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/></svg><span>' +
      esc(T('Who says it')) + '</span><i class="num" id="iuc-cb-n"></i>';
    var before = bar0.querySelector('[data-open="all"]');
    bar0.insertBefore(b, before || null);
    bar0.classList.add('iuc-5');
    b.addEventListener('click', openPick);
  }
  function doorCount() {
    var el = $('iuc-cb-n'); if (!el) return;
    var n = sideOn().length + (R.filterOn('bz') ? 1 : 0);
    el.textContent = n ? N(n) : '';
    el.parentNode.classList.toggle('on', !!n);
  }
  function pickEl() {
    var d = $('iuc-pick');
    if (d) return d;
    d = document.createElement('dialog'); d.id = 'iuc-pick'; d.className = 'iuc-pick'; d.setAttribute('aria-labelledby', 'iuc-pick-h');
    if (FA) d.setAttribute('dir', 'rtl');
    d.innerHTML = '<div class="iuc-pk-top"><h2 id="iuc-pick-h">' + esc(T('Who is speaking')) + '</h2><button type="button" class="iuc-pk-x" data-pk-x aria-label="' + esc(T('Close')) + '">&times;</button></div>' +
      '<p class="iuc-pk-p">' + esc(T('Pick one or several. Each shows what that side says, and every story it is among the tellers of.')) + '</p>' +
      '<div class="iuc-pk-b" id="iuc-pk-b"></div>' +
      '<div class="iuc-pk-foot"><button type="button" class="iuc-pk-clr" data-pk-clr>' + esc(T('Clear')) + '</button><button type="button" class="iuc-pk-go" data-pk-x id="iuc-pk-go"></button></div>';
    root.appendChild(d);
    d.addEventListener('click', function (ev) {
      if (ev.target === d) { closePick(); return; }          // a tap on the dimmed page around the sheet closes it
      var b = ev.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-pk-x')) { closePick(); return; }
      if (b.hasAttribute('data-pk-clr')) { R.filter('bz', ''); R.filter('side', ''); return; }
      if (b.hasAttribute('data-pk-media')) { closePick(); R.tab('media'); var t = $('iuc-tab'); if (t) t.scrollIntoView({ block: 'start' }); return; }
      if (b.hasAttribute('data-bz')) { var v = b.getAttribute('data-bz'); R.filter('bz', R.filterOn('bz') === v ? '' : v); return; }
      if (b.hasAttribute('data-tok')) {
        var tk = b.getAttribute('data-tok');
        if (tk.indexOf('+') >= 0) {          // a shortcut that is several camps at once (all of Prince Reza Pahlavi's camp)
          var ts = tk.split('+'), all = ts.every(function (x) { return sideOn().indexOf(x) >= 0; });
          var cur = sideOn().filter(function (x) { return x !== 'free' && ts.indexOf(x) < 0; });
          R.filter('side', (all ? cur : cur.concat(ts)).join(','));
        } else toggle(tk);
      }
    });
    d.addEventListener('toggle', function (ev) { var g = ev.target.getAttribute && ev.target.getAttribute('data-g'); if (g) OPEN[g] = ev.target.open; }, true);
    d.addEventListener('close', function () { var b = $('iuc-cb'); if (b) { try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); } } });          // back to the door without scrolling the page to it
    return d;
  }
  function openPick() {
    var d = pickEl(); drawPick();
    if (!d.open) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
  }
  function closePick() { var d = $('iuc-pick'); if (d && d.open) { if (d.close) d.close(); else d.removeAttribute('open'); } }
  function chip(tok, label, n, extra) {
    var on = sideOn().indexOf(tok) >= 0, zero = !n && !on;
    return '<button type="button" class="iuc-chip' + (extra ? ' ' + extra : '') + (zero ? ' is-zero' : '') + '" data-tok="' + esc(tok) + '" aria-pressed="' + on + '"' + (zero ? ' disabled' : '') + '>' +
      label + ' <b class="num">' + N(n) + '</b></button>';
  }
  function drawPick() {
    var body = $('iuc-pk-b'); if (!body) return;
    var on = sideOn(), bz = R.filterOn('bz');
    var bzChip = function (v, label, cls) {
      var n = countBz(v), act = bz === v;
      return '<button type="button" class="iuc-chip ' + cls + (!n && !act ? ' is-zero' : '') + '" data-bz="' + v + '" aria-pressed="' + act + '"' + (!n && !act ? ' disabled' : '') + '>' + esc(label) + ' <b class="num">' + N(n) + '</b></button>';
    };
    var pahl = ['c:pahlavi', 'c:x_pahlavi'], pn = 0;
    R.items().forEach(function (it) { if (told(it, pahl[0]) || told(it, pahl[1])) pn++; });
    var pOn = pahl.every(function (x) { return on.indexOf(x) >= 0; });
    var h = '<div class="iuc-pk-quick">' + chip('free', esc(T('Without the regime\'s media')), count('free'), 'iuc-free') +
      bzChip('rg', T('Regime only'), 'iuc-q-rg') + bzChip('hid', T('What the regime hides'), 'iuc-q-hid') +
      '<button type="button" class="iuc-chip iuc-q-pa' + (!pn && !pOn ? ' is-zero' : '') + '" data-tok="' + pahl.join('+') + '" aria-pressed="' + pOn + '"' + (!pn && !pOn ? ' disabled' : '') + '>' + esc(T('Everyone for the Prince')) + ' <b class="num">' + N(pn) + '</b></button></div>';
    GROUPS.forEach(function (g) {
      var ks = CAMPS.filter(function (k) { return camp(k)[1] === g[0]; });
      if (!ks.length) return;
      var gn = count(g[0]);
      var nOn = ks.filter(function (k) { return on.indexOf('c:' + k) >= 0; }).length + (on.indexOf(g[0]) >= 0 ? 1 : 0);
      var open = OPEN[g[0]] != null ? OPEN[g[0]] : nOn > 0 || g[0] === 'rg';
      h += '<details class="iuc-pk-g" data-g="' + esc(g[0]) + '"' + (open ? ' open' : '') + '><summary><i style="background:' + esc(g[2]) + '"></i><b>' + esc(g[1]) + '</b> <small class="num">' + N(gn) + '</small>' +
        (nOn ? '<em class="num">' + esc(T('{n} on', { n: N(nOn) })) + '</em>' : '') + '</summary><div class="iuc-pk-cs">' +
        (ks.length > 1 ? chip(g[0], '<span>' + esc(T('All of them')) + '</span>', gn, 'iuc-all') : '') +
        ks.map(function (k) { return chip('c:' + k, '<i style="background:' + esc(camp(k)[2]) + '"></i><span>' + esc(camp(k)[0]) + '</span>', count('c:' + k)); }).join('') + '</div></details>';
    });
    h += '<p class="iuc-pk-more"><button type="button" class="iuc-link" data-pk-media>' + esc(T('Who is behind each label')) + '</button></p>';
    body.innerHTML = h;
    var go = $('iuc-pk-go'), n = R.shown().length;
    if (go) go.textContent = T('Show {n}', { n: N(n) });
  }
  door();

  /* ---------------------------------------------------------------- 5. the spotlight */
  function whyLine(k) {
    var c = camp(k);
    return c[3] ? '<small class="iuc-why">' + esc(c[3]) + '</small>' : '';
  }
  function outletOf(name) { return (C.outlets || []).filter(function (x) { return x[0] === name || (x[4] || []).indexOf(name) >= 0; })[0]; }
  function outletWhy(name) {
    var o = outletOf(name);
    return o ? '<small class="iuc-why">' + esc(o[2]) + ' <em>(' + esc(sure(o[3])) + ')</em></small>' : '';
  }
  function alsoLine(it) {
    var ca = (it.ca || []).filter(function (k) { return C.camps[k]; });
    return ca.length ? '<p class="iuc-also">' + esc(T('Also: {camp}', { camp: ca.map(function (k) { return camp(k)[0]; }).join(SEP) })) + ' ' + ca.map(whyLine).join('') + '</p>' : '';
  }
  function evLine(it) {
    if (!it.ce) return '';
    return '<p class="iuc-ev"><b>' + esc(it.cs === 'a' ? T('Read by the room from its own words, not checked by a person:') : T('From its own posts:')) + '</b> <q dir="auto">' + esc(unent(it.ce)) + '</q></p>';
  }
  function xPosts(it) {
    var ids = it.rx || [];
    var ps = ids.map(function (id) { return R.byId(id) || R.byId('L' + id); }).filter(Boolean);          // the page keys the last hours as L + id
    if (!ps.length) return '';
    return '<section class="iuc-x" aria-label="' + esc(T('What X is saying about it')) + '"><h3>' + esc(T('What X is saying about it')) + '</h3><ul>' + ps.slice(0, 6).map(function (p) {
      var rg = R.regime && R.regime(p), lk = p.lk > 0 ? T('{n} likes', { n: N(p.lk.toLocaleString('en-US')) }) : '';
      var who = '<b dir="auto">' + bd(esc(p.nm || p.h)) + '</b> <small><bdi dir="ltr">' + esc(p.h || '') + '</bdi></small>' + (p.cb && p.cb !== 'un' && p.cb !== 'person' ? ' ' + pill(p.cb) : '');
      var words = '<span class="iuc-x-t" dir="auto">' + esc(unent((R.fullText && R.fullText(p)) || p.t)) + '</span>';
      var meta = '<span class="iuc-x-m">' + esc(lk) + '</span>';
      return '<li>' + (rg ? '<div class="iuc-x-i">' + who + words + meta + '</div>'
        : '<a class="iuc-x-i" href="' + esc(safeU(p.u)) + '" target="_blank" rel="noopener noreferrer">' + who + words + meta + '</a>') + '</li>';
    }).join('') + '</ul></section>';
  }
  R.addSpot(function (it) {
    if (!it || (!it.cb && !it.sb)) return '';
    var h = '';
    if (it.sb && it.sbn) {
      var byG = {};
      Object.keys(it.sbn).forEach(function (k) { var g = camp(k)[1]; (byG[g] = byG[g] || []).push(k); });
      h += '<section class="iuc-s"><h3>' + esc(T('Who is telling this story')) + '</h3>' + bar(it.sb) + '<ul class="iuc-g">' +
        GROUPS.filter(function (g) { return byG[g[0]]; }).map(function (g) {
          return '<li><b style="color:' + esc(g[2]) + '">' + esc(g[1]) + ' ' + N(it.sb[g[0]] || 0) + '</b><ul>' + byG[g[0]].map(function (k) {
            return '<li>' + pill(k) + ' ' + it.sbn[k].map(function (n) { return bd(esc(n)); }).join(SEP) + (it.sbn[k].length === 1 ? outletWhy(it.sbn[k][0]) || whyLine(k) : whyLine(k)) + '</li>';
          }).join('') + '</ul></li>';
        }).join('') + '</ul>' + alsoLine(it) +
        (it.bz === 'rg' ? '<p class="iuc-warn">' + esc(T('Only the regime\'s media tells this story. Read it as the regime\'s claim, not as news.')) + '</p>' : '') +
        (it.bz === 'hid' ? '<p class="iuc-hidnote">' + esc(T('None of the regime\'s outlets this room reads told this story. Free media did.')) + '</p>' : '') +
        '</section>';
    } else if (it.cb) {
      var c = camp(it.cb);
      h += '<section class="iuc-s"><h3>' + esc(T('Who is speaking')) + '</h3><p>' + pill(it.cb) + ' ' + (outletWhy(it.h) || whyLine(it.cb)) + '</p>' + evLine(it) + alsoLine(it) +
        (c[1] === 'rg' ? '<p class="iuc-warn">' + esc(T('This is the regime\'s own voice. It is here so you can see its line, not because it is true.')) + '</p>' : '') + '</section>';
    }
    return h + xPosts(it);
  });

  /* ---------------------------------------------------------------- 6. the Media tab
     Its numbers are counted with told(), the filter's own test (24 Oct 2026): they once counted only an item's own camp
     (cb) while "Show its N" also finds the stories a camp is among the tellers of (ca, sbn, sb), so the button said 14
     for the IRGC and showed 25, and a camp that only co-tells stories had no button at all. */
  function counts() {
    var n = {};
    CAMPS.forEach(function (k) { n['c:' + k] = count('c:' + k); });
    GROUPS.forEach(function (g) { n[g[0]] = count(g[0]); });
    return n;
  }
  var TOPEN = {};          // which groups the reader opened or closed in the Media tab, kept through every redraw
  function tabEl() {
    var el = $('iuc-tab');
    if (!el) {
      el = document.createElement('div'); el.id = 'iuc-tab'; el.className = 'iuc-tab'; el.hidden = true;
      var links = $('ir-links'); if (!links) return null;
      links.parentNode.insertBefore(el, links.nextSibling);
      el.addEventListener('click', function (ev) {
        var s = ev.target.closest('details[data-g] > summary');
        if (s) { TOPEN[s.parentNode.getAttribute('data-g')] = !s.parentNode.open; return; }          // the click comes before the toggle
        var b = ev.target.closest('[data-side]'); if (!b) return;
        var v = b.getAttribute('data-side');
        R.filter('side', R.filterOn('side') === v ? '' : v);
        R.tab('items');
        var l = root.querySelector('.ir-list'); if (l && l.getBoundingClientRect().top < 0) l.scrollIntoView({ block: 'start' });
      });
    }
    var tb = $('ir-ltab');
    if (tb && !tb.querySelector('[data-ltab="media"]')) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('data-ltab', 'media'); b.setAttribute('aria-selected', 'false');
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>' + esc(T('Media'));
      tb.appendChild(b); tb.classList.add('iuc-4');
    }
    return el;
  }
  function drawTab() {
    var el = tabEl(); if (!el) return;
    var n = counts(), on = R.filterOn('side');
    var tchip = function (v, txt, cls) { return '<button type="button" class="iuc-chip' + (cls ? ' ' + cls : '') + '" data-side="' + esc(v) + '" aria-pressed="' + (on === v ? 'true' : 'false') + '">' + txt + '</button>'; };
    var html = '<div class="iuc-tab-h"><h3>' + esc(T('Who runs the media')) + '</h3><p>' + esc(T('Every outlet, channel and account in this room carries the camp behind it: who owns it, runs it or pays for it. Tap one to see only what it says.')) + '</p>' +
      '<div class="iuc-chips">' + tchip('free', esc(T('Without the regime\'s media')), 'iuc-free') + GROUPS.map(function (g) {
        var c = n[g[0]] || 0;
        return c || on === g[0] ? tchip(g[0], '<i style="background:' + esc(g[2]) + '"></i>' + esc(g[1]) + ' <b class="num">' + N(c) + '</b>') : '';
      }).join('') + '</div></div>';
    GROUPS.forEach(function (g) {
      var ks = CAMPS.filter(function (k) { return camp(k)[1] === g[0]; });
      if (!ks.length) return;
      var gn = n[g[0]] || 0, op = TOPEN[g[0]] != null ? TOPEN[g[0]] : g[0] === 'rg';
      html += '<details class="iuc-grp" data-g="' + esc(g[0]) + '"' + (op ? ' open' : '') + '><summary><i style="background:' + esc(g[2]) + '"></i><b>' + esc(g[1]) + '</b> <small>' + esc(T('{n} in the room now', { n: N(gn) })) + '</small></summary><ul>' +
        ks.map(function (k) {
          var c = camp(k), os = (C.outlets || []).filter(function (o) { return o[1] === k; }), ck = n['c:' + k] || 0;
          return '<li class="iuc-camp"><div class="iuc-camp-h">' + pill(k) + (ck || on === 'c:' + k ? ' <button type="button" class="iuc-chip" data-side="c:' + esc(k) + '" aria-pressed="' + (on === 'c:' + k ? 'true' : 'false') + '">' + esc(T('Show its {n}', { n: N(ck) })) + '</button>' : '') + '</div>' +
            (c[3] ? '<p class="iuc-why">' + esc(c[3]) + '</p>' : '') +
            (PEOPLE.test(k) ? '<p class="iuc-why">' + esc(T('Labels on people come from their own posts. The room never lists private people.')) + '</p>' : '') +
            (os.length ? '<ul class="iuc-os">' + os.map(function (o) { return '<li><b>' + bd(esc(o[0])) + '</b> ' + esc(o[2]) + ' <em>(' + esc(sure(o[3])) + ')</em></li>'; }).join('') + '</ul>' : '') + '</li>';
        }).join('') + '</ul></details>';
    });
    html += '<p class="iuc-foot">' + esc(T('Every label says who owns, runs or pays for a source, never whether one post is true. Something wrong here? Say so in the discussion.')) + '</p>';
    el.innerHTML = html;
  }
  R.addTab('media', { el: 'iuc-tab', draw: drawTab });
  R.onRender(function () {
    // the Media tab is drawn by the room itself (drawLinkList calls its draw) on every render it is open: drawing it here
    // as well drew it twice per render
    var d = $('iuc-pick'); if (d && d.open) drawPick();
    door(); doorCount(); hotChips(); decorate();
  });
  tabEl();
  R.rendered();
})();
