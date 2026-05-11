import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, functionsVersion, appBaseUrl } = appParams;

if (!appId || typeof appId !== 'string') {
  throw new Error('[base44Client] appId está ausente ou inválido. Verifique app-params.js.');
}

// Do NOT pass a static token — let the SDK read it dynamically from storage on each request
// This prevents session bleed when a different user logs in after the app is initialized
export const base44 = createClient({
  appId,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});