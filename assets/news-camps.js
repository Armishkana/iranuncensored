/* WHO IS SPEAKING (site-iu/build/news-camps.js, 23 October 2026). Iran Uncensored's Intel Room only: build/news.py names it in
   the room's data-addons beside intel-forces.js, and hands its data as CFG.camps (from data/media-camps.json, in the page's
   language). The feed's fields it reads are written hourly by ../../site/build/intel_live.py --site iu: cb (the camp of the
   outlet, channel or account), sb (a story's outlets counted by group), sbn (their names by camp), bz 'rg' (a story only
   the regime's media tells) and rx (the X posts about a story).

   Armin, 23 Oct 2026: "Every analysis, every news item, and every article should be categorized in a ground news way, with
   the media clearly marked with its bias: if it's from the Islamic Republic, which part of the Islamic Republic, if it's the
   Paydari camp, if it's the reformists, if it's connected to the Supreme Leadership Office, if it's connected to IRGC, if
   it's connected to the Pahlavi camp, if it's funded by Saudi Arabia ... For each news item ... it needs to be filled with
   Persian tweets, analysis, comments, the ones with the highest likes".

   WHAT IT ADDS
   1. A camp mark on every card, after the room's own marks (IRoom.addBadge): IRGC, the Leader's office, Paydari, the
      reformists, the Pahlavi camp, Saudi money, the British or American governments ... Regime camps are filled red.
      A story only the regime's media tells carries "Regime only".
   2. In every spotlight, WHO IS TELLING THIS STORY: a bar of the story's outlets by group (the Islamic Republic, the
      opposition, foreign-funded, independent, world press, not rated) and each outlet under its camp, with why the label
      is what it is and whether that is public record or reported. A single post or video says who is speaking instead.
   3. In every story's spotlight, WHAT X IS SAYING ABOUT IT: the most-liked X posts in the room about that story (rx).
   4. The Media tab beside Stories: every camp, what it is, how many items of it the room holds now, every outlet the room
      knows under it with the reason, and a tap that shows only that camp. ?side=rg | op | fs | in | wd | free | c:<camp>
      is the filter in the address, with its own pill.
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
  function N(n) { var s = String(n); return FA ? s.replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.charAt(+d); }) : s; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function unent(t) { return String(t || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }          // X sends some text already escaped
  function bd(h) { return '<bdi>' + h + '</bdi>'; }
  var SEP = FA ? '، ' : ', ';
  var GROUPS = C.groups || [], GI = {};          // [[key, label, colour]]
  GROUPS.forEach(function (g, i) { GI[g[0]] = i; });
  function camp(k) { return C.camps[k] || C.camps.un || ['', 'un', '#6B6B6B', '']; }          // [label, group, colour, why]
  function groupOf(it) { return it && it.cb ? camp(it.cb)[1] : 'un'; }
  function pill(k, extra) {
    var c = camp(k);
    return '<span class="iuc' + (c[1] === 'rg' ? ' iuc-rg' : '') + (extra ? ' ' + extra : '') + '" style="--cc:' + esc(c[2]) + '">' + esc(c[0]) + '</span>';
  }
  function sure(o) { return o === 'reported' ? T('reported') : T('public record'); }

  /* 1. the mark on every card */
  R.addBadge(function (it) {
    if (!it || !it.cb) return '';
    var b = it.cb === 'person' || (it.src === 'X' && it.cb === 'un') ? '' : pill(it.cb);
    if (it.bz === 'rg') b += (b ? ' ' : '') + '<span class="iuc iuc-only">' + esc(T('Regime only')) + '</span>';
    return b;
  });

  /* 2 and 3. the spotlight */
  function bar(sb) {
    var tot = 0; GROUPS.forEach(function (g) { tot += sb[g[0]] || 0; });
    if (!tot) return '';
    var words = GROUPS.filter(function (g) { return sb[g[0]]; }).map(function (g) { return g[1] + ' ' + N(sb[g[0]]); }).join(SEP);
    return '<span class="iuc-bar" role="img" aria-label="' + esc(words) + '">' + GROUPS.map(function (g) {
      return sb[g[0]] ? '<i style="flex:' + sb[g[0]] + ';background:' + esc(g[2]) + '"></i>' : '';
    }).join('') + '</span>';
  }
  function whyLine(k) {
    var c = camp(k);
    return c[3] ? '<small class="iuc-why">' + esc(c[3]) + '</small>' : '';
  }
  function outletWhy(name) {
    var o = (C.outlets || []).filter(function (x) { return x[0] === name || (x[4] || []).indexOf(name) >= 0; })[0];
    return o ? '<small class="iuc-why">' + esc(o[2]) + ' <em>(' + esc(sure(o[3])) + ')</em></small>' : '';
  }
  function xPosts(it) {
    var ids = it.rx || [];
    var ps = ids.map(function (id) { return R.byId(id) || R.byId('L' + id); }).filter(Boolean);          // the page keys the last hours as L + id
    if (!ps.length) return '';
    return '<section class="iuc-x" aria-label="' + esc(T('What X is saying about it')) + '"><h3>' + esc(T('What X is saying about it')) + '</h3><ul>' + ps.slice(0, 6).map(function (p) {
      var rg = R.regime && R.regime(p), lk = p.lk > 0 ? T('{n} likes', { n: N(p.lk.toLocaleString('en-US')) }) : '';
      var who = '<b dir="auto">' + bd(esc(p.nm || p.h)) + '</b> <small><bdi dir="ltr">' + esc(p.h || '') + '</bdi></small>' + (p.cb && p.cb !== 'un' ? ' ' + pill(p.cb) : '');
      var words = '<span class="iuc-x-t" dir="auto">' + esc(unent((R.fullText && R.fullText(p)) || p.t)) + '</span>';
      var meta = '<span class="iuc-x-m">' + esc(lk) + '</span>';
      return '<li>' + (rg ? '<div class="iuc-x-i">' + who + words + meta + '</div>'
        : '<a class="iuc-x-i" href="' + esc(p.u) + '" target="_blank" rel="noopener noreferrer">' + who + words + meta + '</a>') + '</li>';
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
        }).join('') + '</ul>' +
        (it.bz === 'rg' ? '<p class="iuc-warn">' + esc(T('Only the regime\'s media tells this story. Read it as the regime\'s claim, not as news.')) + '</p>' : '') +
        '</section>';
    } else if (it.cb) {
      var c = camp(it.cb);
      h += '<section class="iuc-s"><h3>' + esc(T('Who is speaking')) + '</h3><p>' + pill(it.cb) + ' ' + (outletWhy(it.h) || whyLine(it.cb)) + '</p>' +
        (c[1] === 'rg' ? '<p class="iuc-warn">' + esc(T('This is the regime\'s own voice. It is here so you can see its line, not because it is true.')) + '</p>' : '') + '</section>';
    }
    return h + xPosts(it);
  });

  /* 4. the filter and the Media tab */
  function valid(v) { return v === 'free' || GI[v] != null || (v.indexOf('c:') === 0 && !!C.camps[v.slice(2)]); }
  function test(it, v) {
    var g = groupOf(it);
    if (v === 'free') return g !== 'rg';
    if (v.indexOf('c:') === 0) return it.cb === v.slice(2);
    return g === v;
  }
  function label(v) {
    if (v === 'free') return T('Without the regime\'s media');
    if (v.indexOf('c:') === 0) return camp(v.slice(2))[0];
    return GROUPS[GI[v]] ? GROUPS[GI[v]][1] : v;
  }
  R.addFilter({ key: 'side', valid: valid, test: test, label: label });

  function counts() {
    var n = {};
    R.items().forEach(function (it) { if (it.cb) n[it.cb] = (n[it.cb] || 0) + 1; });
    return n;
  }
  function tabEl() {
    var el = $('iuc-tab');
    if (!el) {
      el = document.createElement('div'); el.id = 'iuc-tab'; el.className = 'iuc-tab'; el.hidden = true;
      var links = $('ir-links'); if (!links) return null;
      links.parentNode.insertBefore(el, links.nextSibling);
      el.addEventListener('click', function (ev) {
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
    var chip = function (v, txt, cls) { return '<button type="button" class="iuc-chip' + (cls ? ' ' + cls : '') + '" data-side="' + esc(v) + '" aria-pressed="' + (on === v ? 'true' : 'false') + '">' + txt + '</button>'; };
    var html = '<div class="iuc-tab-h"><h3>' + esc(T('Who runs the media')) + '</h3><p>' + esc(T('Every outlet, channel and account in this room carries the camp behind it: who owns it, runs it or pays for it. Tap one to see only what it says.')) + '</p>' +
      '<div class="iuc-chips">' + chip('free', esc(T('Without the regime\'s media')), 'iuc-free') + GROUPS.map(function (g) {
        var c = 0; Object.keys(n).forEach(function (k) { if (camp(k)[1] === g[0]) c += n[k]; });
        return c ? chip(g[0], '<i style="background:' + esc(g[2]) + '"></i>' + esc(g[1]) + ' <b class="num">' + N(c) + '</b>') : '';
      }).join('') + '</div></div>';
    GROUPS.forEach(function (g) {
      var ks = Object.keys(C.camps).filter(function (k) { return camp(k)[1] === g[0] && k !== 'mek'; });
      if (!ks.length) return;
      var gn = 0; ks.forEach(function (k) { gn += n[k] || 0; });
      html += '<details class="iuc-grp"' + (g[0] === 'rg' ? ' open' : '') + '><summary><i style="background:' + esc(g[2]) + '"></i><b>' + esc(g[1]) + '</b> <small>' + esc(T('{n} in the room now', { n: N(gn) })) + '</small></summary><ul>' +
        ks.map(function (k) {
          var c = camp(k), os = (C.outlets || []).filter(function (o) { return o[1] === k; });
          return '<li class="iuc-camp"><div class="iuc-camp-h">' + pill(k) + (n[k] ? ' <button type="button" class="iuc-chip" data-side="c:' + esc(k) + '" aria-pressed="' + (on === 'c:' + k ? 'true' : 'false') + '">' + esc(T('Show its {n}', { n: N(n[k]) })) + '</button>' : '') + '</div>' +
            (c[3] ? '<p class="iuc-why">' + esc(c[3]) + '</p>' : '') +
            (os.length ? '<ul class="iuc-os">' + os.map(function (o) { return '<li><b>' + bd(esc(o[0])) + '</b> ' + esc(o[2]) + ' <em>(' + esc(sure(o[3])) + ')</em></li>'; }).join('') + '</ul>' : '') + '</li>';
        }).join('') + '</ul></details>';
    });
    html += '<p class="iuc-foot">' + esc(T('Every label says who owns, runs or pays for a source, never whether one post is true. Something wrong here? Say so in the discussion.')) + '</p>';
    el.innerHTML = html;
  }
  R.addTab('media', { el: 'iuc-tab', draw: drawTab });
  R.onRender(function () { var t = $('iuc-tab'); if (t && !t.hidden) drawTab(); });
  tabEl();
  R.rendered();
})();
