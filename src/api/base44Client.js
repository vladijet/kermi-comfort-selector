import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: 'https://kermi-comfort.ru',
  requiresAuth: false,
  appBaseUrl: 'https://kermi-comfort.ru'
});
