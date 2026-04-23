import { env } from '$env/dynamic/private';

export function getApiKey() {
  return env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || null;
}

export function loadConfig() {
  const apiKey = getApiKey();
  return apiKey ? { apiKey, provider: 'anthropic' } : { provider: 'anthropic' };
}
