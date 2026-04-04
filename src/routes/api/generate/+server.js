import Anthropic from '@anthropic-ai/sdk';
import { json } from '@sveltejs/kit';
import { getApiKey } from '$lib/server/config.js';
import { SYSTEM, SKILL_CONTEXT, CHAT_SYSTEM, ageContext } from '$lib/server/prompts.js';
import { repairGuide, summarizeSupport } from '$lib/projectSupport.js';

function isAbortError(err) {
  return err?.constructor?.name === 'APIUserAbortError'
    || err?.name === 'APIUserAbortError'
    || err?.message?.includes('Request was aborted')
    || err?.name === 'AbortError';
}

async function withTimeout(promise, ms) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Generation attempt timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function requestGuide(client, system, userContent, model = 'claude-sonnet-4-6') {
  const msg = await withTimeout(client.messages.create({
    model,
    max_tokens: 3500,
    system,
    messages: [{ role: 'user', content: userContent }],
  }), model === 'claude-sonnet-4-6' ? 40000 : 20000);
  return msg.content?.[0]?.text || '';
}

// Stream first-pass (Haiku) output directly to the client in real-time.
// If validation fails, send a {replacing:true} signal and stream a Sonnet repair.
async function streamBuildGuide(client, system, prompt, userContent, send) {
  let fullText = '';

  const firstPass = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3500,
    system,
    messages: [{ role: 'user', content: userContent }],
  });

  for await (const event of firstPass) {
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      fullText += event.delta.text;
      send({ t: event.delta.text });
    }
  }

  fullText = repairGuide(fullText);
  const validation = summarizeSupport(fullText);
  if (validation.ok) return;

  // First pass failed validation — repair with Sonnet and replace client content
  send({ replacing: true });

  const repairContext = [
    `Original project request: ${prompt}`,
    '',
    'Your previous draft failed validation. Rewrite the FULL guide from scratch and fix every issue below.',
    '',
    'Validation issues:',
    ...(validation.issues || []).map((issue) => `- ${issue}`),
    '',
    'Previous invalid draft:',
    fullText,
  ].join('\n');

  const repairedText = repairGuide(await requestGuide(client, system, repairContext, 'claude-sonnet-4-6'));
  const finalValidation = summarizeSupport(repairedText);

  if (!finalValidation.ok) {
    throw new Error(`Guide failed validation after repair: ${finalValidation.issues.join(' ')}`);
  }

  for (let i = 0; i < repairedText.length; i += 160) {
    send({ t: repairedText.slice(i, i + 160) });
  }
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

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload) => controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
      // Send intent hint first so the client knows BUILD vs CHAT
      send({ intent });
      try {
        if (intent === 'BUILD') {
          await streamBuildGuide(client, fullSystem, prompt, userContent, send);
        } else {
          const text = await requestGuide(client, fullSystem, userContent);
          for (let i = 0; i < text.length; i += 160) {
            send({ t: text.slice(i, i + 160) });
          }
        }
        controller.enqueue(enc.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        if (isAbortError(err)) {
          console.log('Generation aborted');
          try { controller.close(); } catch {}
          return;
        }
        console.error('Generate error:', err.constructor?.name, err.message);
        try {
          send({ error: err.message });
          controller.enqueue(enc.encode('data: [DONE]\n\n'));
          controller.close();
        } catch {}
      }
    },
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
