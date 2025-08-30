const CACHE_NAME = 'nd-express-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Todos os recursos foram cacheados');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Erro ao cachear recursos:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Ativado com sucesso');
      return self.clients.claim();
    })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignorar requisições para outros domínios (exceto Google Fonts)
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('fonts.googleapis.com') &&
      !event.request.url.includes('fonts.gstatic.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna o recurso do cache se encontrado
        if (response) {
          console.log('Service Worker: Servindo do cache:', event.request.url);
          return response;
        }
        
        // Caso contrário, busca na rede
        console.log('Service Worker: Buscando na rede:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clona a resposta para cachear
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('Service Worker: Erro na requisição:', error);
            
            // Retorna uma resposta offline personalizada para páginas HTML
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // Para outros recursos, retorna uma resposta de erro
            return new Response('Recurso não disponível offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Manipulação de mensagens do cliente
self.addEventListener('message', event => {
  console.log('Service Worker: Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Sincronização em background (para futuras implementações)
self.addEventListener('sync', event => {
  console.log('Service Worker: Evento de sincronização:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aqui poderia ser implementada a sincronização de dados
      // quando a conexão for restaurada
      Promise.resolve()
    );
  }
});

// Notificações push (para futuras implementações)
self.addEventListener('push', event => {
  console.log('Service Worker: Notificação push recebida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do ND Express',
    icon: '/manifest-icon-192.png',
    badge: '/manifest-icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: '/manifest-icon-192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/manifest-icon-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('ND Express', options)
  );
});

// Clique em notificações
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Clique na notificação:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Tratamento de erros
self.addEventListener('error', event => {
  console.error('Service Worker: Erro:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: Promise rejeitada:', event.reason);
});

console.log('Service Worker: Script carregado com sucesso');