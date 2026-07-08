// 💧물 줘! Service Worker — PWA 오프라인 지원
// 주의: 앱 파일은 반드시 network-first로 처리해야 한다.
// cache-first로 하면 GitHub에 새 버전을 배포해도 사용자에게 영원히 옛 버전이 보인다.
const CACHE_NAME = 'water-me-v3';
const STATIC_ASSETS = [
  './index.html',
  './app.js',
  './style.css',
  './plants-db.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // 구글 API 요청은 관여하지 않음
  if (event.request.url.includes('googleapis.com') ||
      event.request.url.includes('accounts.google.com') ||
      event.request.method !== 'GET') return;

  // network-first: 항상 최신 파일을 먼저 시도, 오프라인일 때만 캐시 사용
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => cached || caches.match('./index.html'))
      )
  );
});
