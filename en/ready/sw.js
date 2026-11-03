/* The offline copy of «آماده باشیم» (build/ready.py writes this file to fa/ready/sw.js and en/ready/sw.js with the cache
   name, the pages and the files filled in). Its scope is the section's own folder, so it never touches the rest of the site.
   It is registered only when a reader presses the save button (ready.js); nothing is kept without that press.
   install: fetch every page of the section, every same-site script, stylesheet, font and picture those pages name, and the
   PDFs, into one cache named for this build, telling the page how far it got. activate: delete the older copies.
   fetch: pages from the network first and from the copy when there is no network; everything else from the copy first. */
var CACHE = "r1-e0bdf7048d", PREFIX = 'r1-', PAGES = ["./"], FILES = ["../../assets/ready/ready-all.pdf", "../../assets/ready/ready-plan.pdf", "../../assets/ready/ready-kit.pdf", "../../assets/ready/ready-shelter.pdf", "../../assets/ready/ready-after.pdf", "../../assets/ready/ready-leave.pdf", "../../assets/ready/ready-hazard.pdf", "../../assets/ready/ready-protest.pdf", "../../assets/ready/ready-phone.pdf", "../../assets/ready/ready-blackout.pdf", "../../assets/ready/ready-arrest.pdf", "../../assets/ready/ready-record.pdf", "../../assets/ready/ready-news.pdf", "../../assets/ready/ready-aid.pdf", "../../assets/ready/ready-fire.pdf", "../../assets/ready/ready-water.pdf", "../../assets/ready/ready-mind.pdf", "../../assets/ready/ready-together.pdf", "../../assets/ready/ready-plan.png", "../../assets/ready/ready-kit.png", "../../assets/ready/ready-shelter.png", "../../assets/ready/ready-after.png", "../../assets/ready/ready-leave.png", "../../assets/ready/ready-hazard.png", "../../assets/ready/ready-protest.png", "../../assets/ready/ready-phone.png", "../../assets/ready/ready-blackout.png", "../../assets/ready/ready-arrest.png", "../../assets/ready/ready-record.png", "../../assets/ready/ready-news.png", "../../assets/ready/ready-aid.png", "../../assets/ready/ready-fire.png", "../../assets/ready/ready-water.png", "../../assets/ready/ready-mind.png", "../../assets/ready/ready-together.png", "../../assets/fonts/vazirmatn.woff2", "../../assets/fonts/lalezar.woff2", "../../assets/fonts/publicsans.woff2", "../../assets/fonts/bigshoulders.woff2"];
var ASSET = /\.(?:js|mjs|css|woff2?|png|jpe?g|webp|svg|gif|ico|json|webmanifest|pdf)(?:[?#]|$)/i;

function tell(m) {
  return self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function (cs) { cs.forEach(function (c) { c.postMessage(m); }); });
}

function refs(text, base) {
  var out = [], rx = /<(?:script|link|img|source)\b[^>]*?\s(?:src|href)="([^"]+)"/gi, m;
  while ((m = rx.exec(text))) {
    try {
      var u = new URL(m[1].replace(/&amp;/g, '&'), base);
      if (u.origin === self.location.origin && ASSET.test(u.pathname + u.search)) { u.hash = ''; out.push(u.href); }
    } catch (e) { /* not an address */ }
  }
  return out;
}

function fill() {
  var scope = self.registration.scope, pages = PAGES.map(function (p) { return new URL(p, scope).href; });
  var files = FILES.map(function (p) { return new URL(p, scope).href; }), seen = {}, done = 0, total = pages.length + files.length;
  pages.concat(files).forEach(function (u) { seen[u] = 1; });
  return caches.open(CACHE).then(function (c) {
    var step = function () { done++; return tell({ rd: 'p', n: done, t: total }); };
    var one = function (u) {
      return fetch(u, { cache: 'reload' }).then(function (r) { if (r.ok) { return c.put(u, r); } }).catch(function () { }).then(step);
    };
    return pages.reduce(function (p, u) {
      return p.then(function () {
        return fetch(u, { cache: 'reload' }).then(function (r) {
          if (!r.ok) { throw new Error('page ' + r.status); }
          return r.clone().text().then(function (t) {
            refs(t, u).forEach(function (a) { if (!seen[a]) { seen[a] = 1; files.push(a); total++; } });
            return c.put(u, r);
          });
        }).then(step);
      });
    }, Promise.resolve()).then(function () {
      return files.reduce(function (p, u) { return p.then(function () { return one(u); }); }, Promise.resolve());
    });
  }).then(function () { return tell({ rd: 'done', n: done, t: total }); }, function (err) { tell({ rd: 'fail' }); throw err; });
}

self.addEventListener('install', function (ev) { ev.waitUntil(fill().then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (ev) {
  ev.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf(PREFIX) === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('message', function (ev) { if (ev.data === 'fill') { ev.waitUntil(fill()); } });

self.addEventListener('fetch', function (ev) {
  var r = ev.request;
  if (r.method !== 'GET') { return; }
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) { return; }
  if (r.mode === 'navigate') {
    ev.respondWith(fetch(r).then(function (res) {
      if (res.ok) {      // keep the copy of a page that is already kept fresh; never add one the reader did not ask for
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { return c.match(r, { ignoreSearch: true }).then(function (had) { if (had) { return c.put(r, copy); } }); });
      }
      return res;
    }).catch(function () {
      return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match(new URL('./', self.registration.scope).href); });
    }));
    return;
  }
  ev.respondWith(caches.match(r).then(function (m) {
    return m || fetch(r).catch(function () {
      return caches.match(r, { ignoreSearch: true }).then(function (m2) {
        if (m2) { return m2; }
        if (r.destination === 'script') { return new Response('', { headers: { 'Content-Type': 'text/javascript' } }); }
        return Response.error();
      });
    });
  }));
});
