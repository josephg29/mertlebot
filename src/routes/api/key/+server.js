import { json } from '@sveltejs/kit';
import { loadConfig, saveConfig } from '$lib/server/config.js';
import { llmService } from '$lib/server/llm-service.js';

export async function GET() {
  const config = loadConfig();
  return json({ 
    configured: !!config.apiKey,
    provider: config.provider || 'anthropic'
  });
}

export async function POST({ request }) {
  const body = await request.json();
  const key = body.key?.trim();
  const provider = body.provider || 'anthropic';
  
  if (!key) return json({ error: 'Key required' }, { status: 400 });
  
  // Validate key format based on provider
  if (!llmService.validateApiKey(key)) {
    const providerInfo = llmService.getProviderInfo();
    return json({ 
      error: `Invalid key format for ${providerInfo.name} — expected ${providerInfo.keyExample}` 
    }, { status: 400 });
  }

  const cfg = loadConfig();
  cfg.apiKey = key;
  cfg.provider = provider;
  saveConfig(cfg);
  
  // Update LLM service provider
  llmService.provider = provider;
  llmService.config = cfg;
  
  return json({ ok: true, provider });
}
