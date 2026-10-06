/* Iran Scorecard. Every page works without this file: the lists are in the HTML and the language switch is a
   plain link. What this adds: the search, the scorecard filters, joining (a name and an email kept in this
   browser and sent to the form in data/form.json), the members' vote on a grade, and the note box. */
(function () {
  'use strict';
  var doc = document, html = doc.documentElement, root = html.getAttribute('data-root') || './', lang = html.getAttribute('data-lang') || 'en';
  var fa = lang === 'fa';
  function T(en, f) { return fa ? f : en; }
  function $(id) { return doc.getElementById(id); }
  function digits(s) { return fa ? String(s).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }) : String(s); }
  function store(k, v) { try { if (v === undefined) { return JSON.parse(localStorage.getItem(k) || 'null'); } if (v === null) { localStorage.removeItem(k); } else { localStorage.setItem(k, JSON.stringify(v)); } } catch (x) { } return null; }

  // remember the language a reader picked, so the bare address sends them back to it
  doc.addEventListener('click', function (ev) {
    var a = ev.target.closest ? ev.target.closest('[data-setlang]') : null;
    if (a) { try { localStorage.setItem('iu-lang', a.getAttribute('data-setlang')); } catch (x) { } }
  });
  try { if (!localStorage.getItem('iu-lang')) { localStorage.setItem('iu-lang', lang); } } catch (x) { }

  // ---- the invitation in the corner: a reader can put it away for the visit -------------------------
  var calls = $('calls'), callsX = $('calls-x');
  if (calls && callsX) {
    try { if (sessionStorage.getItem('iu-calls') === 'off') { calls.className += ' off'; } } catch (x) { }
    callsX.addEventListener('click', function () { calls.className += ' off'; try { sessionStorage.setItem('iu-calls', 'off'); } catch (x) { } });
  }

  // ---- the campaign page: play a post from X only when the reader asks for it ---------------------
  // The button and the picture with the play mark both do it. Without this script the picture is a plain
  // link to the post on X. X has no player that shows the video alone: its createVideo() draws the whole
  // post (tried on the live page, 7 October 2026), so the whole post is what opens in the card.
  doc.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-tweet],.tw-pic') : null, li = t ? t.closest('.tw') : null;
    if (!li || ev.ctrlKey || ev.metaKey || ev.shiftKey) { return; }
    var b = li.querySelector('[data-tweet]'), box = li.querySelector('.tw-embed'), list = li.closest('.tws');
    if (!b || !box || !list) { return; }
    ev.preventDefault();
    if (li.classList.contains('open')) { box.scrollIntoView({ block: 'nearest' }); return; }
    var url = 'https://twitter.com/' + list.getAttribute('data-handle') + '/status/' + b.getAttribute('data-tweet');
    li.classList.add('open'); box.hidden = false; b.hidden = true;
    // the line inside is what a reader sees until X answers; X's script replaces the whole block
    box.innerHTML = '<blockquote class="twitter-tweet" data-theme="dark" data-dnt="true" data-lang="' + (fa ? 'fa' : 'en') + '"><a href="' + url + '">' + T('Loading the post from X…', 'داره از ایکس لود می‌شه…') + '</a></blockquote>';
    var miss = function () { if (!box.querySelector('iframe')) { box.innerHTML = '<p>' + T('X did not load here. Use "Open on X".', 'ایکس اینجا باز نشد. ویدیو رو تو خود ایکس ببینید.') + '</p>'; } };
    if (window.twttr && window.twttr.widgets) { window.twttr.widgets.load(box); }
    else if (!doc.getElementById('tw-js')) {
      var s = doc.createElement('script'); s.id = 'tw-js'; s.async = true; s.src = 'https://platform.twitter.com/widgets.js'; s.onerror = miss; doc.head.appendChild(s);
    }
    setTimeout(miss, 9000);
  });

  // ---- search on the front page -------------------------------------------------------------------
  var q = $('q'), hits = $('hits');
  if (q && hits) {
    var index = null;
    var load = function () { if (index) { return; } index = []; fetch(root + 'assets/index.json').then(function (r) { return r.json(); }).then(function (d) { index = d; show(); }); };
    var show = function () {
      var v = q.value.trim().toLowerCase();
      hits.textContent = '';
      if (v.length < 2 || !index) { return; }
      // a name or a state, in either spelling: "cruz", "texas", "tx", and on any page the Persian for them
      var found = index.filter(function (m) { return m.n.toLowerCase().indexOf(v) > -1 || m.sn.toLowerCase().indexOf(v) === 0 || m.st.toLowerCase() === v || (m.f && m.f.indexOf(v) > -1) || (m.sf && m.sf.indexOf(v) === 0); }).slice(0, 8);
      found.forEach(function (m) {
        var li = doc.createElement('li'), a = doc.createElement('a'), b = doc.createElement('b'), s = doc.createElement('small');
        a.href = root + lang + '/members/' + m.s + '/';
        b.textContent = (fa && m.f) ? m.f : m.n; b.dir = 'auto';
        // the score is a whole number out of 100 (a string, so a 0 is still shown); on a Persian page the
        // state and the score are in Persian
        if (fa && m.sf) { s.textContent = m.sf + (m.g ? ' · ' + digits(m.g) + ' از ۱۰۰' : ''); }
        else { s.textContent = m.p + '-' + m.st + (m.g ? ' · ' + m.g + ' out of 100' : ''); s.dir = 'ltr'; }
        a.appendChild(b); a.appendChild(s); li.appendChild(a); hits.appendChild(li);
      });
    };
    q.addEventListener('focus', load);
    q.addEventListener('input', function () { load(); show(); });
  }

  // ---- the state picker under the search: opens the scorecard on that state ----------------------
  var sp = $('statepick');
  if (sp) {
    sp.addEventListener('change', function () { if (sp.value) { location.href = root + lang + '/scorecard/?st=' + encodeURIComponent(sp.value); } });
    // coming back from the list, the picker is empty again, so the same state can be picked a second time
    window.addEventListener('pageshow', function () { sp.selectedIndex = 0; });
  }

  // ---- the scorecard filters ----------------------------------------------------------------------
  var rows = $('rows');
  if (rows && $('tools')) {
    var all = Array.prototype.slice.call(rows.children), count = $('count'), empty = $('empty');
    var f = { q: $('fq'), ch: $('fch'), party: $('fparty'), state: $('fstate'), grade: $('fgrade'), mark: $('fmark'), sort: $('fsort') };
    var pre = /[?&]q=([^&]*)/.exec(location.search);
    if (pre) { f.q.value = decodeURIComponent(pre[1].replace(/\+/g, ' ')); }
    // a door on the front page opens the list on one range of scores (?g=A is 90 to 100, down to ?g=F) or one mark (?show=mek)
    var preG = /[?&]g=([ABCDF])(&|$)/.exec(location.search), preM = /[?&]show=(mek3|mek|pah)(&|$)/.exec(location.search);
    if (preG) { f.grade.value = preG[1]; }
    // the picker on the front page opens the list on one state (?st=TX); a state that is not in the list is ignored
    var preS = /[?&]st=([A-Za-z]{2})(&|$)/.exec(location.search);
    if (preS && f.state.querySelector('option[value="' + preS[1].toUpperCase() + '"]')) { f.state.value = preS[1].toUpperCase(); }
    if (preM) { f.mark.value = preM[1]; }
    var apply = function () {
      var v = f.q.value.trim().toLowerCase(), n = 0;
      var order = all.slice();
      if (f.sort.value === 'worst') { order.sort(function (a, b) { var x = +a.dataset.score, y = +b.dataset.score; return (x < 0) - (y < 0) || x - y; }); }
      else if (f.sort.value === 'name') { order.sort(function (a, b) { return a.dataset.name.split(' ').pop().localeCompare(b.dataset.name.split(' ').pop()); }); }
      order.forEach(function (li) {
        var d = li.dataset;
        var ok = (!v || d.name.indexOf(v) > -1 || (d.fa && d.fa.indexOf(v) > -1) || d.state.toLowerCase() === v) && (!f.ch.value || d.ch === f.ch.value) && (!f.party.value || d.party === f.party.value) &&
          (!f.state.value || d.state === f.state.value) && (!f.grade.value || d.grade === f.grade.value) &&
          (!f.mark.value || (f.mark.value === 'mek' && +d.mek > 0) || (f.mark.value === 'mek3' && +d.mek >= 3) || (f.mark.value === 'pah' && d.pah === '1'));
        li.hidden = !ok; n += ok;
        rows.appendChild(li);
      });
      count.textContent = digits(n) + ' ' + count.dataset.of + ' ' + digits(all.length) + ' ' + count.dataset.word;
      empty.hidden = n > 0;
    };
    Object.keys(f).forEach(function (k) { f[k].addEventListener(k === 'q' ? 'input' : 'change', apply); });
    apply();
  }

  // ---- membership: a name and an email, kept here and sent once to the form ------------------------
  var cfg = (window.IU && window.IU.form) || null;
  function me() { var m = store('iu-me'); return m && m.email ? m : null; }
  function okMail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); }
  function post(kind, message, about, page) {
    // One row in the sheet. The form takes any text for each field; the reader's own name and email ride
    // in their own columns. no-cors: the answer cannot be read, so a network failure is the only failure seen.
    var m = me() || {}, d = new URLSearchParams(), F = cfg.fields;
    d.append(F.kind, kind); d.append(F.message, message); d.append(F.name, m.name || ''); d.append(F.email, m.email || '');
    d.append(F.page, page || location.href); d.append(F.about, about || ''); d.append(F.lang, lang);
    return fetch(cfg.action, { method: 'POST', mode: 'no-cors', body: d });
  }
  function limited() {
    var now = Date.now(), log = (store('iu-sent') || []).filter(function (t) { return now - t < 3600000; });
    if (log.length >= 20) { return true; }
    log.push(now); store('iu-sent', log); return false;
  }
  function signUp(nameEl, mailEl, status, page) {
    var name = nameEl.value.trim(), mail = mailEl.value.trim();
    if (!name) { status.textContent = T('Give a name to show with what you write.', 'یه اسم بنویسید که کنار نظرتون دیده بشه.'); status.className = 'status bad'; nameEl.focus(); return null; }
    if (!okMail(mail)) { status.textContent = T('That email does not look right.', 'این ایمیل انگار درست نیست.'); status.className = 'status bad'; mailEl.focus(); return null; }
    store('iu-me', { name: name.slice(0, 40), email: mail, since: new Date().toISOString().slice(0, 10) });
    return post('join', 'joined', '', page);
  }

  var jf = $('joinform');
  if (jf && cfg) {
    var joined = $('joined'), as = $('joinedas'), js = $('joinstatus');
    var paint = function () {
      var m = me();
      jf.hidden = !!m; joined.hidden = !m;
      if (m) { as.textContent = T('Signed in on this device as ', 'روی این دستگاه با این اسم عضو هستید: ') + m.name + '.'; }
    };
    jf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if ($('jhp').value) { return; }
      var p = signUp($('jname'), $('jmail'), js, jf.dataset.page);
      if (!p) { return; }
      js.textContent = T('Joining…', 'یه لحظه…'); js.className = 'status';
      p.then(paint, function () { store('iu-me', null); js.textContent = T('That did not go through. Check your connection and try again.', 'نشد. اینترنت‌تون رو چک کنید و دوباره امتحان کنید.'); js.className = 'status bad'; });
    });
    $('leave').addEventListener('click', function () { store('iu-me', null); paint(); });
    paint();
  }

  // ---- the note box ---------------------------------------------------------------------------------
  var sf = $('sayform'), fab = $('fab');
  if (sf && cfg) {
    var msg = $('saymsg'), st = $('saystatus'), joinin = $('sayjoin'), meLine = $('sayme'), linkRow = $('saylinkrow'), link = $('saylink'), aboutLine = $('sayabout');
    var about = sf.dataset.about || '';
    var kind = function () { var r = sf.querySelector('input[name=kind]:checked'); return r ? r.value : 'opinion'; };
    var needsMember = function () { return kind() !== 'wrong'; };
    var hints = {
      opinion: T('Write it in your own words.', 'هر جور راحتید بنویسید.'),
      video: T('Say in a line what the video shows.', 'تو یه خط بگید ویدیو چی رو نشون می‌ده.'),
      source: T('What did they say or do, and where did you see it?', 'چی گفته یا چی کار کرده، و کجا دیدید؟'),
      wrong: T('What is wrong, and what should it say?', 'کجاش اشتباهه و درستش چیه؟')
    };
    var paintSay = function () {
      var k = kind(), m = me();
      linkRow.hidden = !(k === 'video' || k === 'source');
      msg.placeholder = hints[k];
      joinin.hidden = !(needsMember() && !m);
      meLine.hidden = !m;
      if (m) { meLine.textContent = T('Sending as ', 'فرستنده: ') + m.name; }
      aboutLine.hidden = !about;
      if (about) { aboutLine.textContent = T('About: ', 'دربارهٔ: ') + about; }
    };
    sf.addEventListener('change', paintSay);
    doc.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-say]') : null;
      if (!b) { return; }
      var r = sf.querySelector('input[name=kind][value="' + b.getAttribute('data-say') + '"]');
      if (r) { r.checked = true; }
      // a "Discuss this" button under one measure carries what the note is about
      if (b.hasAttribute('data-about')) { about = b.getAttribute('data-about'); }
      paintSay();
      setTimeout(function () { msg.focus({ preventScroll: true }); }, 50);
    });
    sf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if ($('sayhp').value) { return; }
      var text = msg.value.trim(), k = kind();
      if (text.length < 3) { st.textContent = T('Write your note first.', 'اول متن‌تون رو بنویسید.'); st.className = 'status bad'; msg.focus(); return; }
      var first = Promise.resolve();
      if (needsMember() && !me()) {
        first = signUp($('sjname'), $('sjmail'), st, sf.dataset.page);
        if (!first) { return; }
      }
      if (limited()) { st.textContent = T('That is a lot of notes in one hour. Come back a little later.', 'تو یه ساعت پیام‌های زیادی فرستادید. یه کم بعد دوباره امتحان کنید.'); st.className = 'status bad'; return; }
      var body = text + (link.value.trim() && !linkRow.hidden ? '\n-----\nlink: ' + link.value.trim() : '');
      st.textContent = T('Sending…', 'داره فرستاده می‌شه…'); st.className = 'status';
      first.then(function () { return post(k, body, about, sf.dataset.page); }).then(function () {
        msg.value = ''; link.value = '';
        st.textContent = T('Sent. Thank you. I read every one.', 'فرستاده شد. ممنون. همه رو می‌خونم.'); st.className = 'status ok';
        paintSay();
      }, function () { st.textContent = T('That did not go through. Check your connection and try again.', 'فرستاده نشد. اینترنت‌تون رو چک کنید و دوباره امتحان کنید.'); st.className = 'status bad'; });
    });
    paintSay();
    if (fab && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { fab.hidden = en[0].isIntersecting; }).observe(sf);
    }
  }

  // ---- is this grade fair: one vote per member per politician ---------------------------------------
  var fair = doc.querySelector('[data-fair]');
  if (fair && cfg) {
    var slug = fair.getAttribute('data-fair'), who = fair.getAttribute('data-name'), fs = fair.querySelector('.status'), btns = fair.querySelectorAll('[data-vote]');
    var mine = function () { return (store('iu-votes') || {})[slug]; };
    var paintFair = function () {
      var v = mine();
      Array.prototype.forEach.call(btns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-vote') === v)); });
      if (v) { fs.textContent = T('Your vote is in. Counts on this page are updated when I publish.', 'رأی‌تون ثبت شد. تعداد رأی‌ها با هر به‌روزرسانی سایت عوض می‌شه.'); fs.className = 'status ok'; }
    };
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        if (!me()) {
          fs.innerHTML = '';
          var a = doc.createElement('a');
          a.href = root + lang + '/join/'; a.className = 'btn btn-key'; a.textContent = T('Join to vote: a name and an email', 'برای رأی دادن عضو بشید: یه اسم و یه ایمیل');
          fs.appendChild(a); fs.className = 'status';
          return;
        }
        var v = b.getAttribute('data-vote'), votes = store('iu-votes') || {};
        if (votes[slug] === v || limited()) { return; }
        votes[slug] = v; store('iu-votes', votes); paintFair();
        post('vote', v, who, location.href).then(null, function () { delete votes[slug]; store('iu-votes', votes); paintFair(); fs.textContent = T('That did not go through. Try again.', 'نشد. دوباره امتحان کنید.'); fs.className = 'status bad'; });
      });
    });
    paintFair();
  }
})();
