import { json } from '@sveltejs/kit';
import { loadConfig, saveConfig } from '$lib/server/config.js';
import { llmService } from '$lib/server/llm-service.js';

export async function GET() {
  const config = loadConfig();
  const provider = config.provider || 'anthropic';
  const hasEnvKey = provider === 'deepseek'
    ? !!process.env.DEEPSEEK_API_KEY
    : !!process.env.ANTHROPIC_API_KEY;
  return json({
    configured: !!config.apiKey || hasEnvKey,
    provider
  });
}

export async function POST({ request }) {
  const body = await request.json();
  const key = body.key?.trim();
  const provider = body.provider || 'anthropic';
  
  if (!key) return json({ error: 'Key required' }, { status: 400 });
  
  // Validate key format based on the provider being saved (not the current active provider)
  if (!llmService.validateApiKey(key, provider)) {
    const providerNames = { anthropic: 'Anthropic Claude', deepseek: 'DeepSeek' };
    const keyExamples = { anthropic: 'sk-ant-abc123...', deepseek: 'sk-1234567890abcdef...' };
    return json({
      error: `Invalid key format for ${providerNames[provider] || provider} — expected ${keyExamples[provider] || 'a valid API key'}`
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
