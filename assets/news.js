/* The Newsroom (news/ on iranuncensored.com, «اتاق خبر»). What it does and why: news.py, at the top.
   Reads ONE same-origin file, assets/news-live.json ("schema": 1, written hourly by ../../site/build/intel_live.py --site iu),
   and draws: the language filter, the topic chips (24 hours and 7 days), the province tiles, the ranked list, Copy the
   roundup, and Add (a public post, sent as a mission report through the site's own community.js, mission send-news).
   RULES THIS FILE KEEPS, IN CODE:
   - nothing anyone typed and nothing from the feed is ever written as HTML: every string passes esc();
   - a regime or Iran-hosted item is never a link (isRegime): its words can be copied, its address is never opened;
   - every other link opens in a new tab with rel="noopener noreferrer";
   - no picture, video or script from anyone else is ever loaded;
   - an unknown schema is refused, and the headlines the page arrived with stay;
   - nothing the reader sees can say "undefined", "NaN" or "[object" (txt() and num() below). */
(function () {
  'use strict';
  var D = document, HTML = D.documentElement, FA = HTML.getAttribute('lang') === 'fa';
  var box = D.getElementById('nw');
  if (!box) return;
  var SCHEMA = 1, PAGE_N = 40, ROUNDUP_N = 25, MISSION = 'send-news';

  /* Every word the script writes, English then spoken Persian (../PERSIAN.md). */
  var W = {
    news: ['News', 'خبر'], video: ['YouTube', 'یوتیوب'], x: ['X', 'X'],
    ago_min: ['{n} min ago', '{n} دقیقه پیش'], ago_h: ['{n} h ago', '{n} ساعت پیش'], now: ['just now', 'همین الان'],
    mins: ['{n} minutes', '{n} دقیقه'], hours: ['{n} hours', '{n} ساعت'], hour1: ['1 hour', '۱ ساعت'],
    outlets: ['{n} outlets in {h}', '{n} رسانه تو {h}'],
    views: ['{n} views in {h}', '{n} بازدید تو {h}'],
    likes: ['{n} likes', '{n} لایک'], reposts: ['{n} reposts', '{n} بازنشر'],
    also: ['Also: {list}', 'همین‌طور: {list}'],
    regime: ['Regime media', 'رسانهٔ رژیم'],
    regime_why: ["Not linked: opening it would show the regime's servers who you are.", 'لینک نشده: اگه بازش کنید، سرورهای رژیم می‌فهمن شما کی هستید.'],
    copy_h: ['Copy the headline', 'کپی تیتر'],
    status: ['Updated {t}. {n} stories and posts from {s} sources, the last {w} hours.', '{t} به‌روز شد. {n} خبر و پست از {s} منبع، {w} ساعت گذشته.'],
    shown: ['Showing {n} of {all}.', '{n} تا از {all} تا.'],
    stale: ['These are {t} old: the hourly update has stopped for now.', 'این خبرها مال {t} پیشه: به‌روزرسانی ساعتی فعلاً متوقف شده.'],
    loading: ['Loading the news...', 'خبرها داره لود می‌شه...'],
    failed: ["The latest news didn't load. Check your connection and open the page again. These are the headlines the page came with.", 'خبرهای تازه لود نشد. اینترنت‌تون رو چک کنید و صفحه رو دوباره باز کنید. اینا تیترهاییه که صفحه باهاشون اومد.'],
    schema: ['This page is older than its news. Open it again to see the latest. These are the headlines it came with.', 'این صفحه از خبرهاش قدیمی‌تره. دوباره بازش کنید تا تازه‌ترین‌ها رو ببینید. اینا تیترهاییه که صفحه باهاشون اومد.'],
    empty: ['Nothing matches. Clear a filter.', 'چیزی پیدا نشد. یه فیلتر رو بردارید.'],
    clear: ['Clear filters', 'پاک کردن فیلترها'],
    f_tp: ['Topic: {v}', 'موضوع: {v}'], f_pv: ['Province: {v}', 'استان: {v}'], f_ln: ['Language: {v}', 'زبان: {v}'],
    lang_fa: ['Persian', 'فارسی'], lang_en: ['English', 'انگلیسی'],
    d7: ['7 days: {n}', '۷ روز: {n}'], since: ['since {d}: {n}', 'از {d}: {n}'],
    tile: ['{p}: {n} stories in the last {w} hours', '{p}: {n} خبر تو {w} ساعت گذشته'],
    tile0: ['{p}: no story names it in the last {w} hours', '{p}: تو {w} ساعت گذشته هیچ خبری اسمش رو نیاورده'],
    copied: ['Copied {n}, X and YouTube first. Paste it into a chat.', '{n} تا کپی شد، اول X و یوتیوب. تو چت بذاریدش.'],
    copied_rg: [' {m} from regime media left out: they have no link to give.', ' {m} تا از رسانه‌های رژیم رو نذاشتم، چون لینکی ندارن.'],
    copied_one: ['Headline copied.', 'تیتر کپی شد.'],
    copy_none: ['Nothing to copy. Clear a filter first.', 'چیزی برای کپی نیست. اول یه فیلتر رو بردارید.'],
    copy_blocked: ['This browser blocked copying. Select the text and copy it yourself.', 'این مرورگر اجازهٔ کپی نمی‌ده. متن رو انتخاب کنید و خودتون کپی کنید.'],
    add: ['Add a public post', 'یه پست عمومی اضافه کنید'], add_in: ['Sign in to add', 'برای اضافه کردن وارد بشید'],
    a_url: ['Paste the full link, the one that starts with https://', 'لینک کامل رو بذارید، همونی که با https:// شروع می‌شه.'],
    a_private: ["That's a link to a private chat or group. Only public posts can go here.", 'این لینک یه چت یا گروه خصوصیه. اینجا فقط پست عمومی می‌شه گذاشت.'],
    a_regime: ["That link is on the regime's servers. Opening it would show them who you are, so it can't go here.", 'این لینک روی سرورهای رژیمه. باز کردنش به رژیم نشون می‌ده شما کی هستید، برای همین اینجا نمی‌شه گذاشتش.'],
    a_line: ['Write one line about what it shows.', 'یه خط بنویسید که چی نشون می‌ده.'],
    a_have: ['That one is already on the page.', 'این یکی از قبل تو صفحه هست.'],
    a_sending: ['Sending...', 'داره ارسال می‌شه...'],
    a_sent: ["Thank you. It's in. I check it, usually within a day.", 'ممنون. رسید. معمولاً تا یه روز چکش می‌کنم.'],
    a_held: [' One step left: confirm your email with the link I sent you.', ' یه قدم مونده: ایمیل‌تون رو با لینکی که فرستادم تأیید کنید.'],
    a_signin: ['Sign in, then press Send again. What you wrote is still here.', 'وارد بشید، بعد دوباره ارسال رو بزنید. چیزی که نوشتید همین‌جا مونده.'],
    a_closed: ["Sending isn't open yet. Try again later.", 'فعلاً ارسال باز نیست. بعداً دوباره امتحان کنید.'],
    a_failed: ["That didn't go through. Check your connection and try again.", 'نشد. اینترنت‌تون رو چک کنید و دوباره امتحان کنید.']
  };
  var MONTHS = FA ? ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function txt(v) { return (v === null || v === undefined || typeof v === 'object' || (typeof v === 'number' && !isFinite(v))) ? '' : String(v); }
  function esc(v) { return txt(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function digits(s) { return FA ? txt(s).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.charAt(+d); }) : txt(s); }
  function num(n) {
    n = Math.round(+n || 0);
    var s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, FA ? '٬' : ',');
    return digits((n < 0 ? '-' : '') + s);
  }
  function w(k, v) {
    var s = (W[k] || ['', ''])[FA ? 1 : 0];
    if (v) Object.keys(v).forEach(function (x) { s = s.split('{' + x + '}').join(txt(v[x])); });
    return s;
  }
  function $(id) { return D.getElementById(id); }

  /* ---- the regime rule: the same list as DENY_DIRECT in intel_live.py and REGIME_DOMAINS in news.py */
  var REGIME = ['presstv.com', 'presstv.co.uk', 'presstv.tv', 'tasnimnews.com', 'mehrnews.com', 'farsnews.com', 'tehrantimes.com',
    'ifpnews.com', 'iranpress.com', 'parstoday.com', 'hispantv.com', 'abna24.com', 'taghribnews.com', 'alkawthartv.com',
    'iran-daily.com', 'irandaily.com', 'iribnews.com', 'irib.com', 'khamenei.com', 'nournews.com', 'iusnews.com', 'xn--mgba3a4f16a'];
  function hostOf(u) { var m = /^https?:\/\/([^\/:?#\s]+)/i.exec(txt(u)); return m ? m[1].toLowerCase().replace(/\.$/, '') : ''; }
  function regimeHost(h) {
    if (!h) return false;
    if (h === 'ir' || /\.ir$/.test(h) || /\.xn--mgba3a4f16a$/.test(h)) return true;
    for (var i = 0; i < REGIME.length; i++) if (h === REGIME[i] || h.slice(-REGIME[i].length - 1) === '.' + REGIME[i]) return true;
    return false;
  }
  function isRegime(it) { return it.rg === 1 || regimeHost(hostOf(it.u)) || regimeHost(txt(it.dm).toLowerCase()); }

  /* ---- what the page arrived with: topic keys and labels (chips), province names (tiles) */
  var TKEYS = txt(box.getAttribute('data-tkeys')).split(/\s+/).filter(Boolean);
  var CHIP = {}, TILE = {};
  [].forEach.call(box.querySelectorAll('.nw-chip'), function (b) { CHIP[b.getAttribute('data-tp')] = b; });
  [].forEach.call(box.querySelectorAll('.nw-tile'), function (b) { TILE[b.getAttribute('data-pv')] = b; });
  function topicLabel(k) { var b = CHIP[k]; return b ? txt(b.querySelector('.nw-chip-l').textContent) : ''; }
  function provName(k) { var b = TILE[k]; return b ? txt(b.getAttribute('data-name')) : ''; }

  var DOC = null, ITEMS = [], TK = [], S = { ln: 'all', tp: '', pv: '' }, SHOWN = PAGE_N;

  function hoursWords(h) {
    h = +h || 0;
    if (h < 1) return w('mins', { n: num(Math.max(1, Math.round(h * 60))) });
    h = Math.round(h);
    return h === 1 ? w('hour1') : w('hours', { n: num(h) });
  }
  function ago(iso) {
    var t = Date.parse(txt(iso));
    if (!isFinite(t)) return '';
    var m = Math.max(0, (Date.now() - t) / 60000);
    if (m < 2) return w('now');
    if (m < 60) return w('ago_min', { n: num(m) });
    return w('ago_h', { n: num(m / 60) });
  }
  function shortDate(ms) { var d = new Date(ms); return digits(d.getUTCDate()) + ' ' + MONTHS[d.getUTCMonth()]; }

  function topicsOf(it) { return (Array.isArray(it.tp) ? it.tp : []).map(function (i) { return TK[i]; }).filter(Boolean); }
  function match(it, skip) {
    if (skip !== 'ln' && S.ln !== 'all' && it.ln !== S.ln) return false;
    if (skip !== 'tp' && S.tp && topicsOf(it).indexOf(S.tp) < 0) return false;
    if (skip !== 'pv' && S.pv && (!Array.isArray(it.pv) || it.pv.indexOf(S.pv) < 0)) return false;
    return true;
  }

  function measure(it) {
    if (it.src === 'YouTube' && it.vw >= 0) return w('views', { n: num(it.vw), h: hoursWords(it.hs) });
    if (it.src === 'X') {
      var p = [];
      if (it.lk > 0) p.push(w('likes', { n: num(it.lk) }));
      if (it.rp > 0) p.push(w('reposts', { n: num(it.rp) }));
      return p.join(FA ? '، ' : ', ');
    }
    if (it.no > 1) return w('outlets', { n: num(it.no), h: hoursWords(it.hs) });
    return '';
  }
  function outletOf(it) {
    if (it.src === 'X') return txt(it.nm) ? txt(it.nm) + ' ' + txt(it.h) : txt(it.h);
    return (FA && txt(it.hf)) || txt(it.h);
  }
  function itemHtml(it, n) {
    var ln = it.ln === 'fa' ? 'fa' : 'en', dir = ln === 'fa' ? 'rtl' : 'ltr';
    var kind = it.src === 'YouTube' ? 'video' : it.src === 'X' ? 'x' : 'news';
    var heat = Math.max(0, Math.min(100, +it.hot || 0));
    var m = measure(it), also = Array.isArray(it.also) && it.also.length ? w('also', { list: it.also.map(txt).filter(Boolean).join(FA ? '، ' : ', ') }) : '';
    var meta = '<p class="nw-m"><span class="nw-k nw-k-' + kind + '">' + esc(w(kind)) + '</span><span class="nw-o"><bdi>' + esc(outletOf(it)) + '</bdi></span><span class="nw-d">' + esc(ago(it.d)) + '</span></p>';
    var foot = '<p class="nw-w"><span class="nw-heat" aria-hidden="true"><i style="width:' + heat + '%"></i></span>' + (m ? '<span>' + esc(m) + '</span>' : '') + (also ? '<span class="nw-also"><bdi>' + esc(also) + '</bdi></span>' : '') + '</p>';
    if (isRegime(it)) {
      return '<li class="nw-i nw-rg">' + meta + '<p class="nw-t" lang="' + ln + '" dir="' + dir + '">' + esc(it.t) + '</p>' +
        '<p class="nw-rgn"><b>' + esc(w('regime')) + '</b> ' + esc(w('regime_why')) + '</p>' +
        '<p class="nw-w"><button type="button" class="nw-cp" data-copy="' + n + '">' + esc(w('copy_h')) + '</button></p></li>';
    }
    var u = txt(it.u);
    if (!/^https:\/\//i.test(u)) return '';
    return '<li class="nw-i">' + meta + '<a class="nw-t" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer" lang="' + ln + '" dir="' + dir + '">' + esc(it.t) + '</a>' + foot + '</li>';
  }

  var VIEW = [];
  function render() {
    VIEW = ITEMS.filter(function (it) { return match(it); });
    var list = $('nw-list');
    var html = '';
    for (var i = 0; i < VIEW.length && i < SHOWN; i++) html += itemHtml(VIEW[i], i);
    list.innerHTML = html || '<li class="nw-empty">' + esc(w('empty')) + '</li>';
    $('nw-more').hidden = VIEW.length <= SHOWN;
    // chips: 24 hours under the language and province filters, 7 days from the archive
    var wk = (DOC && DOC.week) || {}, from = Date.parse(txt(wk.from)), full = isFinite(from) && Date.now() - from >= 6.5 * 864e5;
    TKEYS.forEach(function (k) {
      var b = CHIP[k]; if (!b) return;
      var n = ITEMS.filter(function (it) { return match(it, 'tp') && topicsOf(it).indexOf(k) >= 0; }).length;
      b.querySelector('[data-n24]').textContent = num(n);
      var n7 = wk.tp && wk.tp[k] >= 0 ? wk.tp[k] : 0;
      b.querySelector('[data-n7]').textContent = isFinite(from) ? (full ? w('d7', { n: num(n7) }) : w('since', { d: shortDate(from), n: num(n7) })) : '';
      b.setAttribute('aria-pressed', S.tp === k ? 'true' : 'false');
    });
    // tiles: under the language and topic filters
    var cnt = {}, top = 0;
    ITEMS.forEach(function (it) { if (match(it, 'pv') && Array.isArray(it.pv)) it.pv.forEach(function (k) { cnt[k] = (cnt[k] || 0) + 1; }); });
    Object.keys(cnt).forEach(function (k) { if (cnt[k] > top) top = cnt[k]; });
    Object.keys(TILE).forEach(function (k) {
      var b = TILE[k], n = cnt[k] || 0, lvl = !n || !top ? 0 : Math.max(1, Math.min(4, Math.ceil(4 * n / top)));
      b.className = 'nw-tile nw-l' + lvl;
      b.querySelector('[data-n]').textContent = n ? num(n) : '';
      b.setAttribute('aria-pressed', S.pv === k ? 'true' : 'false');
      var label = n ? w('tile', { p: provName(k), n: num(n), w: num(winH()) }) : w('tile0', { p: provName(k), w: num(winH()) });
      b.setAttribute('aria-label', label); b.title = label;
    });
    var lit = Object.keys(cnt).filter(function (k) { return TILE[k]; }).sort(function (a, b) { return cnt[b] - cnt[a]; }).slice(0, 3);
    $('nw-maptop').innerHTML = lit.map(function (k) { return esc(provName(k)) + ' <b class="num">' + num(cnt[k]) + '</b>'; }).join(' · ');
    [].forEach.call(box.querySelectorAll('.nw-seg [data-ln]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-ln') === S.ln ? 'true' : 'false'); });
    pills();
    status();
  }
  function winH() { return DOC && (DOC.windowHours === 36 ? 36 : 24) || 24; }
  function pills() {
    var p = [];
    if (S.ln !== 'all') p.push(['ln', w('f_ln', { v: w('lang_' + S.ln) })]);
    if (S.tp) p.push(['tp', w('f_tp', { v: topicLabel(S.tp) })]);
    if (S.pv) p.push(['pv', w('f_pv', { v: provName(S.pv) })]);
    var el = $('nw-pills');
    el.hidden = !p.length;
    el.innerHTML = p.map(function (x) { return '<button type="button" class="nw-pill" data-off="' + x[0] + '"><span>' + esc(x[1]) + '</span><i aria-hidden="true">&times;</i></button>'; }).join('') +
      (p.length > 1 ? '<button type="button" class="nw-pill nw-pill-all" data-off="all">' + esc(w('clear')) + '</button>' : '');
  }
  function status() {
    if (!DOC) return;
    var at = Date.parse(txt(DOC.at)), age = (Date.now() - at) / 36e5, src = DOC.sources || {};
    var nsrc = (+src.news || 0) + (+src.rss || 0) + (+src.youtube || 0) + (src.x > 0 ? 1 : 0);
    var s = age > 3 ? w('stale', { t: hoursWords(age) }) : w('status', { t: ago(DOC.at), n: num(ITEMS.length), s: num(nsrc), w: num(winH()) });
    if (VIEW.length !== ITEMS.length) s += ' ' + w('shown', { n: num(VIEW.length), all: num(ITEMS.length) });
    var el = $('nw-status'); el.textContent = s; el.className = 'nw-status' + (age > 3 ? ' nw-bad' : '');
  }
  function toast(t, bad) { var el = $('nw-toast'); el.textContent = t; el.className = 'nw-toast nw-on' + (bad ? ' nw-bad' : ''); clearTimeout(toast.t); toast.t = setTimeout(function () { el.className = 'nw-toast'; }, 6000); }

  /* ---- copying: the roundup in the shape Kaveh sends: numbered, a short headline, the link; X and YouTube first */
  function copyText(t, done) {
    function fallback() {
      var ta = D.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
      D.body.appendChild(ta); ta.select();
      var ok = false; try { ok = D.execCommand('copy'); } catch (e) { ok = false; }
      D.body.removeChild(ta);
      if (ok) done(); else toast(w('copy_blocked'), true);
    }
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) navigator.clipboard.writeText(t).then(done, fallback);
    else fallback();
  }
  function clipT(t, n) { t = txt(t).replace(/\s+/g, ' ').trim(); return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; }
  function roundup() {
    var rg = VIEW.filter(isRegime).length, ok = VIEW.filter(function (it) { return !isRegime(it) && /^https:\/\//.test(txt(it.u)); });
    var first = ok.filter(function (it) { return it.src === 'X' || it.src === 'YouTube'; }), rest = ok.filter(function (it) { return it.src !== 'X' && it.src !== 'YouTube'; });
    var pick = first.concat(rest).slice(0, ROUNDUP_N);
    if (!pick.length) { toast(w('copy_none'), true); return; }
    var t = pick.map(function (it, i) { return num(i + 1) + '. ' + clipT(it.t, 100) + '\n' + txt(it.u); }).join('\n\n');
    copyText(t, function () { toast(w('copied', { n: num(pick.length) }) + (rg ? w('copied_rg', { m: num(rg) }) : '')); });
  }

  /* ---- Add: the link and one line, sent through community.js as a mission report about quest:send-news */
  var PRIVATE = [/^https:\/\/(t|telegram)\.me\/(\+|joinchat\/|c\/)/i, /^https:\/\/(chat|api)\.whatsapp\.com\//i, /^https:\/\/wa\.me\//i,
    /^https:\/\/(signal\.group|signal\.me)\//i, /^https:\/\/(www\.)?(m\.me|messenger\.com)\//i, /^https:\/\/(www\.)?instagram\.com\/direct\//i,
    /^https:\/\/(www\.|m\.)?facebook\.com\/(messages|groups)\//i, /^https:\/\/(discord\.gg|(www\.)?discord(app)?\.com\/invite)\//i,
    /^https:\/\/(www\.)?(x|twitter)\.com\/(messages|i\/chat)\b/i, /^https:\/\/([a-z0-9-]+\.)?(eitaa\.com|rubika\.ir|ble\.ir|splus\.ir|igap\.net|soroush-app\.ir)\b/i];
  function fixUrl(u) { u = txt(u).trim(); if (/^(www\.|[a-z0-9-]+\.[a-z]{2,}\/)/i.test(u)) u = 'https://' + u; return u.replace(/^http:\/\//i, 'https://'); }
  function lp(cb, tries) { if (window.LP && window.LP.quests) { cb(window.LP); return; } if ((tries || 0) > 75) { cb(null); return; } setTimeout(function () { lp(cb, (tries || 0) + 1); }, 200); }
  function amsg(t, bad) { var m = $('nw-a-msg'); m.textContent = t || ''; m.className = 'nw-msg' + (bad ? ' nw-bad' : ''); }
  /* What may be sent: '' when the link and the line are fine, else the reason, in the reader's language. Checked before
     anything else happens, whether or not sending is open on this copy of the site. */
  function addProblem(u, line) {
    if (!/^https:\/\/[^\s\/<>"']+\.[^\s<>"']+$/.test(u)) return ['a_url', 'nw-a-url'];
    if (PRIVATE.some(function (r) { return r.test(u); })) return ['a_private', 'nw-a-url'];
    if (regimeHost(hostOf(u))) return ['a_regime', 'nw-a-url'];
    if (ITEMS.some(function (it) { return txt(it.u) === u; })) return ['a_have', 'nw-a-url'];
    if (line.length < 8) return ['a_line', 'nw-a-line'];
    return null;
  }
  function setupAdd() {
    var btn = $('nw-add-b'), form = $('nw-add'), LPX = null, sending = false;
    $('nw-a-x').addEventListener('click', function () { form.hidden = true; if (!btn.hidden) btn.focus(); });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (sending) return;
      var u = fixUrl($('nw-a-url').value), line = txt($('nw-a-line').value).replace(/\s+/g, ' ').trim();
      var bad = addProblem(u, line);
      if (bad) { amsg(w(bad[0]), true); $(bad[1]).focus(); return; }
      if (!LPX) { amsg(w('a_closed'), true); return; }
      send(LPX, u, line);
    });
    lp(function (L) {
      if (!L || L.off || !L.quests || L.quests.off || typeof L.quests.report !== 'function') return;      // no sending on this copy: no button, no error
      LPX = L;
      function signedIn() { return !!(L.quests.who && L.quests.who()); }
      function label() { btn.textContent = signedIn() ? w('add') : w('add_in'); }
      label(); btn.hidden = false;
      if (L.quests.sub) L.quests.sub(label);
      btn.addEventListener('click', function () {
        if (!signedIn() && L.open) { L.open('auth', {}); return; }
        form.hidden = !form.hidden;
        if (!form.hidden) { amsg(''); $('nw-a-url').focus(); }
      });
    });
    function send(L, u, line) {
      sending = true; $('nw-a-send').disabled = true; amsg(w('a_sending'));
      L.quests.report({ about: 'quest:' + MISSION, subject: ('Newsroom: ' + line).slice(0, 80), text: line.slice(0, 300), url: u, made: false }, $('nw-a-send')).then(function (r) {
        sending = false; $('nw-a-send').disabled = false;
        if (r && r.ok) {
          $('nw-a-url').value = ''; $('nw-a-line').value = '';
          amsg(w('a_sent') + (r.post && r.post.status === 'held' ? w('a_held') : ''));
          return;
        }
        var c = r && r.code;
        if (c === 'lp/signin' || c === 'lp/name') amsg(w('a_signin'));
        else if (c === 'lp/closed') amsg(w('a_closed'), true);
        else amsg(txt(r && r.text) || w('a_failed'), true);
      }, function () { sending = false; $('nw-a-send').disabled = false; amsg(w('a_failed'), true); });
    }
  }

  /* ---- wiring */
  box.addEventListener('click', function (ev) {
    var b = ev.target.closest ? ev.target.closest('button') : null;
    if (!b || !box.contains(b)) return;
    if (b.hasAttribute('data-ln')) { S.ln = b.getAttribute('data-ln'); SHOWN = PAGE_N; render(); return; }
    if (b.hasAttribute('data-tp')) { var k = b.getAttribute('data-tp'); S.tp = S.tp === k ? '' : k; SHOWN = PAGE_N; render(); return; }
    if (b.hasAttribute('data-pv')) {
      var p = b.getAttribute('data-pv'); S.pv = S.pv === p ? '' : p; SHOWN = PAGE_N; render();
      if (S.pv) toast(b.getAttribute('aria-label'));
      return;
    }
    if (b.hasAttribute('data-off')) { var o = b.getAttribute('data-off'); if (o === 'all') S = { ln: 'all', tp: '', pv: '' }; else S[o] = o === 'ln' ? 'all' : ''; SHOWN = PAGE_N; render(); return; }
    if (b.hasAttribute('data-copy')) { var it = VIEW[+b.getAttribute('data-copy')]; if (it) copyText(txt(it.t), function () { toast(w('copied_one')); }); return; }
    if (b.id === 'nw-more') { SHOWN += PAGE_N; render(); return; }
    if (b.id === 'nw-copy') { roundup(); }
  });

  function start(doc) {
    if (!doc || typeof doc !== 'object' || doc.schema !== SCHEMA || !Array.isArray(doc.items)) {
      var el = $('nw-status'); el.textContent = w('schema'); el.className = 'nw-status nw-bad'; return;
    }
    DOC = doc;
    TK = Array.isArray(doc.topics) ? doc.topics.map(txt) : [];
    ITEMS = doc.items.filter(function (it) { return it && typeof it === 'object' && txt(it.t) && txt(it.u); });
    $('nw-copy').hidden = false;
    render();
  }

  // On a phone the map folds under its heading (the three provinces named most stay in view); on a wider screen it is open.
  var mapd = $('nw-mapd');
  if (mapd && window.matchMedia && window.matchMedia('(max-width: 759px)').matches) mapd.open = false;
  $('nw-status').textContent = w('loading');
  var src = txt(box.getAttribute('data-src'));
  // a new address every ten minutes, so a cached copy is never older than the hourly file by more than that
  fetch(src + '?t=' + Math.floor(Date.now() / 6e5), { credentials: 'omit' }).then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then(start, function () { var el = $('nw-status'); el.textContent = w('failed'); el.className = 'nw-status nw-bad'; });
  setupAdd();
})();
