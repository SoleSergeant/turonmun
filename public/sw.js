// TuronMUN SW - Suicide/Unregister Script
// This script is used to unregister any existing service workers that are causing 503 errors on subdomains.

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    self.registration.unregister()
        .then(() => self.clients.matchAll())
        .then((clients) => {
            clients.forEach(client => client.navigate(client.url));
        });
});
