import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Plugin customizado para interceptar requisições virtuais do PWA da Base44 no ambiente local
// Elimina os erros 404 de @vite-plugin-pwa, export default missing, e o Syntax Error do manifest.webmanifest
function pwaLocalMockPlugin() {
  return {
    name: 'pwa-local-mock',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.includes('@vite-plugin-pwa/pwa-entry-point-loaded')) {
          res.setHeader('Content-Type', 'application/javascript');
          res.end('export default function pwaEntryPointLoaded() { console.log("[PWA] Entry point loaded (mock local ativado com sucesso)."); return true; };');
          return;
        }
        if (req.url?.includes('manifest.webmanifest') || req.url?.includes('manifest.json')) {
          res.setHeader('Content-Type', 'application/manifest+json');
          res.end(JSON.stringify({
            name: "Chamsa Isa Plus",
            short_name: "Chamsa Isa",
            start_url: "/",
            display: "standalone",
            background_color: "#ffffff",
            theme_color: "#0284c7",
            icons: [
              {
                src: "https://media.base44.com/images/public/69fca602fc26c81e3e0767df/2215309d9_orengostei.png",
                sizes: "192x192",
                type: "image/png"
              }
            ]
          }));
          return;
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    pwaLocalMockPlugin(),
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ]
});