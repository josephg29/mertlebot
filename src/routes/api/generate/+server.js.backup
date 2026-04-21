import Anthropic from '@anthropic-ai/sdk';
import { json } from '@sveltejs/kit';
import { getApiKey } from '$lib/server/config.js';
import { SYSTEM, SKILL_CONTEXT, CHAT_SYSTEM, ageContext } from '$lib/server/prompts.js';

function isAbortError(err) {
  return err?.constructor?.name === 'APIUserAbortError'
    || err?.name === 'APIUserAbortError'
    || err?.message?.includes('Request was aborted')
    || err?.name === 'AbortError';
}

async function classifyIntent(client, prompt) {
  try {
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      system: 'Classify the user message. Reply with EXACTLY one word: BUILD if they want you to design/create/generate a specific hardware project or build guide (e.g. "make me an LED blinker", "build a robot arm", "I want a temperature sensor project"), or CHAT for anything else (questions, conversation, brainstorming, asking for help, asking what you can do, greetings, clarifications, opinions, vague ideas without a concrete project request). When in doubt, reply CHAT. Reply with only BUILD or CHAT, nothing else.',
      messages: [{ role: 'user', content: prompt }],
    });
    const answer = res.content[0].text.trim().toUpperCase();
    return answer === 'BUILD' ? 'BUILD' : 'CHAT';
  } catch (err) {
    console.error('Intent classification failed, defaulting to BUILD:', err.message);
    return 'BUILD';
  }
}

export async function GET() {
  return json({ error: 'Method Not Allowed — use POST' }, {
    status: 405,
    headers: { 'Allow': 'POST' }
  });
}

export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  const skill = body.skill || 'MONKEY';
  const age = Number(body.age) || 25;
  const clarifications = typeof body.clarifications === 'string' ? body.clarifications.trim() : null;

  if (!prompt) return json({ error: 'Prompt required' }, { status: 400 });
  if (prompt.length > 50000) return json({ error: 'Prompt too long' }, { status: 400 });

  const apiKey = getApiKey();
  if (!apiKey) return json({ error: 'API key not configured — open settings' }, { status: 401 });

  const client = new Anthropic({ apiKey });

  const intent = await classifyIntent(client, prompt);
  console.log(`Intent: ${intent} — "${prompt.slice(0, 60)}"`);

  const skillContext = SKILL_CONTEXT[skill] || SKILL_CONTEXT.MONKEY;
  const buildSystem = SYSTEM + '\n\n' + skillContext + '\n\n' + ageContext(age);
  const chatSystem = CHAT_SYSTEM + '\n\n' + ageContext(age);
  const fullSystem = intent === 'BUILD' ? buildSystem : chatSystem;

  const userContent = (intent === 'BUILD' && clarifications) ? `${prompt}\n\n${clarifications}` : prompt;

  const msgStream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: intent === 'BUILD' ? 4096 : 1024,
    system: fullSystem,
    messages: [{ role: 'user', content: userContent }],
  });

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send intent hint first so the client knows BUILD vs CHAT
      controller.enqueue(enc.encode(`data: ${JSON.stringify({ intent })}\n\n`));

      let chunks = 0;

      msgStream.on('text', (text) => {
        chunks++;
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ t: text })}\n\n`));
        } catch { /* controller closed */ }
      });

      msgStream.on('end', () => {
        console.log(`Stream ended — ${chunks} text chunks sent`);
        try {
          controller.enqueue(enc.encode('data: [DONE]\n\n'));
          controller.close();
        } catch { /* already closed */ }
      });

      msgStream.on('error', (err) => {
        if (isAbortError(err)) {
          console.log('Stream aborted (client disconnect)');
          try { controller.close(); } catch { /* already closed */ }
          return;
        }
        console.error('Stream error:', err.constructor?.name, err.message);
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
          controller.enqueue(enc.encode('data: [DONE]\n\n'));
          controller.close();
        } catch { /* already closed */ }
      });
    },
    cancel() {
      console.log('Client disconnected — aborting Anthropic stream');
      try { msgStream.abort(); } catch { /* ignore */ }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  });
}
