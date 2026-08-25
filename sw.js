const CACHE='meu-treino-v6';
const ASSETS=['./','./index.html','./workout-v6.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch('./index.html',{cache:'no-store'}).then(async r=>{
      let html=await r.text();
      html=html.replace(/<script src="\.\/workout-v5\.js\?v=5"><\/script>/g,'');
      if(!html.includes('workout-v6.js'))html=html.replace('</body>','<script src="./workout-v6.js?v=6"></script></body>');
      return new Response(html,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{let x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x));return r}).catch(()=>caches.match(e.request)));
});
