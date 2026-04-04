import Anthropic from '@anthropic-ai/sdk';
import { loadConfig } from './config.js';

/**
 * LLM Service Abstraction Layer
 * Supports both Anthropic (Claude) and DeepSeek APIs
 */

export class LLMService {
  constructor() {
    this.config = loadConfig();
    this.provider = this.config.provider || 'anthropic';
  }

  /**
   * Classify intent (BUILD vs CHAT)
   */
  async classifyIntent(prompt) {
    const systemPrompt = 'Classify the user message. Reply with EXACTLY one word: BUILD if they want you to design/create/generate a specific hardware project or build guide (e.g. "make me an LED blinker", "build a robot arm", "I want a temperature sensor project"), or CHAT for anything else (questions, conversation, brainstorming, asking for help, asking what you can do, greetings, clarifications, opinions, vague ideas without a concrete project request). When in doubt, reply CHAT. Reply with only BUILD or CHAT, nothing else.';

    if (this.provider === 'anthropic') {
      return this._anthropicClassifyIntent(prompt, systemPrompt);
    } else {
      return this._deepseekClassifyIntent(prompt, systemPrompt);
    }
  }

  /**
   * Generate a streamed response
   */
  async generateStream(options) {
    const { prompt, system, skill, age, clarifications, intent } = options;
    
    if (this.provider === 'anthropic') {
      return this._anthropicGenerateStream({ prompt, system, skill, age, clarifications, intent });
    } else {
      return this._deepseekGenerateStream({ prompt, system, skill, age, clarifications, intent });
    }
  }

  /**
   * Ask clarification questions
   */
  async clarify(prompt, availableQuestions, systemPrompt) {
    if (this.provider === 'anthropic') {
      return this._anthropicClarify(prompt, availableQuestions, systemPrompt);
    } else {
      return this._deepseekClarify(prompt, availableQuestions, systemPrompt);
    }
  }

  /**
   * Generate simulation files
   */
  async simulate(prompt, guide, systemPrompt) {
    if (this.provider === 'anthropic') {
      return this._anthropicSimulate(prompt, guide, systemPrompt);
    } else {
      return this._deepseekSimulate(prompt, guide, systemPrompt);
    }
  }

  /**
   * Validate API key format
   */
  validateApiKey(key) {
    if (this.provider === 'anthropic') {
      return /^sk-ant-/.test(key);
    } else {
      // DeepSeek keys typically start with sk- but not always
      return key && key.length > 10;
    }
  }

  /**
   * Get provider info for UI
   */
  getProviderInfo() {
    if (this.provider === 'anthropic') {
      return {
        name: 'Anthropic Claude',
        models: {
          fast: 'claude-haiku-4-5-20251001',
          smart: 'claude-sonnet-4-6'
        },
        keyPrefix: 'sk-ant-',
        keyExample: 'sk-ant-abc123...'
      };
    } else {
      return {
        name: 'DeepSeek',
        models: {
          fast: 'deepseek-chat',
          smart: 'deepseek-chat'
        },
        keyPrefix: 'sk-',
        keyExample: 'sk-1234567890abcdef...'
      };
    }
  }

  // ===========================================================================
  // Anthropic Implementation
  // ===========================================================================

  async _anthropicClassifyIntent(prompt, systemPrompt) {
    const apiKey = this.config.apiKey;
    if (!apiKey) throw new Error('API key not configured');

    const client = new Anthropic({ apiKey });
    
    try {
      const res = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });
      const answer = res.content[0].text.trim().toUpperCase();
      return answer === 'BUILD' ? 'BUILD' : 'CHAT';
    } catch (err) {
      console.error('Anthropic intent classification failed:', err.message);
      return 'BUILD'; // Default to BUILD on error
    }
  }

  async _anthropicGenerateStream(options) {
    const { prompt, system, skill, age, clarifications, intent } = options;
    const apiKey = this.config.apiKey;
    if (!apiKey) throw new Error('API key not configured');

    const client = new Anthropic({ apiKey });
    const userContent = (intent === 'BUILD' && clarifications) ? `${prompt}\n\n${clarifications}` : prompt;
    const model = intent === 'BUILD' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
    const maxTokens = intent === 'BUILD' ? 4096 : 1024;

    const msgStream = client.messages.stream({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }],
    });

    return {
      stream: msgStream,
      abort: () => msgStream.abort(),
      provider: 'anthropic'
    };
  }

  async _anthropicClarify(prompt, availableQuestions, systemPrompt) {
    const apiKey = this.config.apiKey;
    if (!apiKey) return []; // Silently skip if no key

    const client = new Anthropic({ apiKey });
    const allIds = availableQuestions.map(q => q.id).join(', ');

    try {
      const res = await Promise.race([
        client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 80,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: `Prompt: "${prompt}"\n\nAvailable question IDs: ${allIds}\n\nReturn a JSON array of IDs to ask.`,
          }],
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);

      let ids;
      try {
        ids = JSON.parse(res.content[0].text.trim());
        if (!Array.isArray(ids)) ids = availableQuestions.map(q => q.id);
      } catch {
        ids = availableQuestions.map(q => q.id);
      }

      return ids;
    } catch {
      return availableQuestions.map(q => q.id);
    }
  }

  async _anthropicSimulate(prompt, guide, systemPrompt) {
    const apiKey = this.config.apiKey;
    if (!apiKey) throw new Error('API key not configured');

    const client = new Anthropic({ apiKey });

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Project: ${prompt}\n\nBuild guide:\n${guide.slice(0, 6000)}`
      }],
    });

    return msg.content[0].text;
  }

  // ===========================================================================
  // DeepSeek Implementation
  // ===========================================================================

  async _deepseekClassifyIntent(prompt, systemPrompt) {
    const apiKey = this.config.apiKey;
    if (!apiKey) throw new Error('API key not configured');

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          max_tokens: 10,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const answer = data.choices[0].message.content.trim().toUpperCase();
      return answer === 'BUILD' ? 'BUILD' : 'CHAT';
    } catch (err) {
      console.error('DeepSeek intent classification failed:', err.message);
      return 'BUILD'; // Default to BUILD on error
    }
  }

  async _deepseekGenerateStream(options) {
    const { prompt, system, skill, age, clarifications, intent } = options;
    const apiKey = this.config.apiKey;
    if (!apiKey) throw new Error('API key not configured');

    const userContent = (intent === 'BUILD' && clarifications) ? `${prompt}\n\n${clarifications}` : prompt;
    const maxTokens = intent === 'BUILD' ? 4096 : 1024;

    const controller = new AbortController();
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent }
        ],
        stream: true
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    return {
      stream: response.body,
      abort: () => controller.abort(),
      provider: 'deepseek'
    };
  }

  async _deepseekClarify(prompt, availableQuestions, systemPrompt) {
    const apiKey = this.config.apiKey;
    if (!apiKey) return []; // Silently skip if no key

    const allIds = availableQuestions.map(q => q.id).join(', ');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          max_tokens: 80,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Prompt: "${prompt}"\n\nAvailable question IDs: ${allIds}\n\nReturn a JSON array of IDs to ask.` }
          ],
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      let ids;
      try {
        ids = JSON.parse(data.choices[0].message.content.trim());
        if (!Array.isArray(ids)) ids = availableQuestions.map(q => q.id);
      } catch {
        ids = availableQuestions.map(q => q.id);
      }

      return ids;
    } catch {
      return availableQuestions.map(q => q.id);
    }
  }

  async _deepseekSimulate(prompt, guide, systemPrompt) {
    const apiKey = this.config.apiKey;
    if (!apiKey) throw new Error('API key not configured');

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Project: ${prompt}\n\nBuild guide:\n${guide.slice(0, 6000)}` }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

// Singleton instance
export const llmService = new LLMService();