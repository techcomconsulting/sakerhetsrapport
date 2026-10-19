const CACHE='sakerhetsrapport-v14';
const SHELL=['./','index.html','style.css?v=14','app.js?v=14','manifest.webmanifest','icon-192.png','icon-512.png','icon-180.png',
 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js',
 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const req=e.request;if(req.method!=='GET')return;
 const u=new URL(req.url);
 if(u.hostname.endsWith('supabase.co'))return; // data går alltid direkt till servern
 // Nätet först, sparad kopia om det inte finns täckning
 const egen=u.origin===location.origin;
 e.respondWith(fetch(egen?new Request(req,{cache:'no-cache'}):req).then(res=>{if(res.ok&&(u.origin===location.origin||SHELL.includes(req.url)||u.hostname.endsWith('gstatic.com')||u.hostname.endsWith('googleapis.com'))){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp))}return res})
  .catch(()=>caches.match(req).then(m=>m||(req.mode==='navigate'?caches.match('index.html'):Response.error()))));
});
